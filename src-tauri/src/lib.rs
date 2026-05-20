mod commands;

use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_tables",
            sql: r"CREATE TABLE IF NOT EXISTS 'cash_flow' ('date' DATETIME PRIMARY KEY NOT NULL, 'salary' REAL NOT NULL, 'expenses' REAL NOT NULL, 'petty_cash' REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS 'item_categories' ('id' INTEGER PRIMARY KEY NOT NULL, 'name' TEXT NOT NULL, 'ferous' BOOLEAN NOT NULL DEFAULT 'false');
        CREATE TABLE IF NOT EXISTS item_purchases(
          id INTEGER PRIMARY KEY NOT NULL,
          description TEXT NOT NULL,
          category INTEGER NOT NULL,
          FOREIGN KEY(category) REFERENCES item_categories(id)
        );
        CREATE TABLE IF NOT EXISTS item_sales(
          id INTEGER PRIMARY KEY NOT NULL,
          description TEXT NOT NULL,
          category INTEGER NOT NULL,
          FOREIGN KEY(category) REFERENCES item_categories(id)
        );
        CREATE TABLE IF NOT EXISTS transaction_purchases(
          `date` DATETIME NOT NULL,
          item INTEGER NOT NULL,
          weight REAL NOT NULL,
          price REAL NOT NULL,
          PRIMARY KEY (`date`, item),
          FOREIGN KEY(item) REFERENCES item_purchases(id)
        );
        CREATE TABLE IF NOT EXISTS transaction_sales(
          `date` DATETIME NOT NULL,
          item INTEGER NOT NULL,
          weight REAL NOT NULL,
          price REAL NOT NULL,
          PRIMARY KEY (`date`, item),
          FOREIGN KEY(item) REFERENCES item_sales(id)
        );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_views",
            sql: r"DROP VIEW IF EXISTS purchases_items;
        CREATE VIEW purchases_items AS SELECT item_purchases.id AS id, description, item_categories.id AS category_id, name AS category FROM item_purchases LEFT JOIN item_categories ON item_purchases.category = item_categories.id ORDER BY id;
        DROP VIEW IF EXISTS sales_items;
        CREATE VIEW sales_items AS SELECT item_sales.id AS id, description, item_categories.id AS category_id, name AS category FROM item_sales LEFT JOIN item_categories ON item_sales.category = item_categories.id ORDER BY id;
        DROP VIEW IF EXISTS purchases;
        CREATE VIEW purchases AS SELECT `date`, CAST(strftime('%Y', `date`) AS INTEGER) AS year, CAST(strftime('%m', `date`) AS INTEGER) AS month, item_categories.id AS category_id, name AS category, item AS item_id, description AS item, weight, price, price / weight AS average_price FROM transaction_purchases LEFT JOIN item_purchases ON item = item_purchases.id LEFT JOIN item_categories ON item_purchases.category = item_categories.id ORDER BY year DESC, month, item_id;
        DROP VIEW IF EXISTS sales;
        CREATE VIEW sales AS SELECT `date`, CAST(strftime('%Y', `date`) AS INTEGER) AS year, CAST(strftime('%m', `date`) AS INTEGER) AS month, item_categories.id AS category_id, name AS category, item AS item_id, description AS item, weight, price, price * weight AS selling_price FROM transaction_sales LEFT JOIN item_sales ON item = item_sales.id LEFT JOIN item_categories ON item_sales.category = item_categories.id ORDER BY year DESC, month, item_id;
        DROP VIEW IF EXISTS yearly_purchases;
        CREATE VIEW yearly_purchases AS SELECT year, sum(weight) AS weight, sum(price) AS price, sum(price) / sum(weight) AS average_price FROM purchases GROUP BY year ORDER BY year DESC;
        DROP VIEW IF EXISTS yearly_sales;
        CREATE VIEW yearly_sales AS SELECT year, sum(weight) AS weight, sum(price * weight) AS price, sum(price * weight) / weight AS average_price FROM sales GROUP BY year ORDER BY year DESC;
        DROP VIEW IF EXISTS monthly_purchases;
        CREATE VIEW monthly_purchases AS SELECT year, month, sum(weight) AS weight, sum(price) AS price, sum(price) / sum(weight) AS average_price FROM purchases GROUP BY year, month ORDER BY year DESC, month;
        DROP VIEW IF EXISTS monthly_sales;
        CREATE VIEW monthly_sales AS SELECT year, month, sum(weight) AS weight, sum(price * weight) AS price, sum(price * weight) / sum(weight) AS average_price FROM sales GROUP BY year, month ORDER BY year DESC, month;
        DROP VIEW IF EXISTS categorical_purchases;
        CREATE VIEW categorical_purchases AS SELECT `date`, year, month, name AS category, sum(weight) AS weight, sum(price) AS price, sum(price) / sum(weight) AS average_price FROM item_categories LEFT JOIN purchases ON id = category_id GROUP BY year, month, category ORDER BY year DESC, month, category;
        DROP VIEW IF EXISTS categorical_sales;
        CREATE VIEW categorical_sales AS SELECT `date`, year, month, category, sum(weight) AS weight, sum(price * weight) AS price, sum(price * weight) / sum(weight) AS average_price FROM item_categories LEFT JOIN sales ON id = category_id GROUP BY year, month, category ORDER BY year DESC, month, category;
        DROP VIEW IF EXISTS overview;
        CREATE VIEW overview AS SELECT `date`, CAST(strftime('%Y', `date`) AS INTEGER) AS year, CAST(strftime('%m', `date`) AS INTEGER) AS month, ifnull(monthly_purchases.weight, 0) AS buy_weight, ifnull(monthly_purchases.price, 0) AS buy_price, ifnull(monthly_purchases.average_price, 0) AS buy_average_price, ifnull(monthly_sales.weight, 0) AS sell_weight, ifnull(monthly_sales.price, 0) AS sell_price, ifnull(monthly_sales.average_price, 0) AS sell_average_price, salary, expenses, petty_cash, ifnull(monthly_sales.price, 0) - ifnull(monthly_purchases.price, 0) - salary - expenses - petty_cash AS profit_loss FROM cash_flow FULL JOIN monthly_purchases ON CAST(strftime('%Y', `date`) AS INTEGER) = monthly_purchases.year AND CAST(strftime('%m', `date`) AS INTEGER) = monthly_purchases.month FULL JOIN monthly_sales ON CAST(strftime('%Y', `date`) AS INTEGER) = monthly_sales.year AND CAST(strftime('%m', `date`) AS INTEGER) = monthly_sales.month ORDER BY year DESC, month;
        DROP VIEW IF EXISTS overview_categories;
        CREATE VIEW overview_categories AS SELECT cash_flow.`date`, CAST(strftime('%Y', cash_flow.`date`) AS INTEGER) AS year, CAST(strftime('%m', cash_flow.`date`) AS INTEGER) AS month, name AS category, ifnull(buy_weight, 0) AS buy_weight, ifnull(buy_price, 0) AS buy_price, ifnull(buy_average_price, 0) AS buy_average_price, ifnull(sell_weight, 0) AS sell_weight, ifnull(sell_price, 0) AS sell_price, ifnull(sell_average_price, 0) AS sell_average_price
        FROM cash_flow FULL JOIN
        (SELECT * FROM item_categories
        LEFT JOIN (SELECT categorical_purchases.year AS buy_year, categorical_purchases.month AS buy_month, categorical_sales.year AS sell_year, categorical_sales.month AS sell_month, categorical_purchases.category AS buy_category, categorical_sales.category AS sell_category, categorical_purchases.weight AS buy_weight, categorical_purchases.price AS buy_price, categorical_purchases.average_price AS buy_average_price, categorical_sales.price AS sell_price, categorical_sales.weight AS sell_weight, categorical_sales.average_price AS sell_average_price
        FROM categorical_purchases FULL JOIN categorical_sales USING (year, month, category)) ON name = buy_category OR name = sell_category
        GROUP BY buy_year, buy_month, buy_category, sell_category)
        ON (CAST(strftime('%Y', cash_flow.`date`) AS INTEGER) = buy_year AND CAST(strftime('%m', cash_flow.`date`) AS INTEGER) = buy_month) OR (CAST(strftime('%Y', cash_flow.`date`) AS INTEGER) = sell_year AND CAST(strftime('%m', cash_flow.`date`) AS INTEGER) = sell_month)
        GROUP BY year, month, category
        HAVING category IS NOT NULL
        ORDER BY year DESC, month, category;",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .manage(commands::updater::StartupState::new())
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations("sqlite:pl_analyser.sqlite", migrations)
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::updater::start_update_check,
            commands::updater::finish_startup,
            commands::updater::close_splashscreen,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

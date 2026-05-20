import { useRoute } from "vue-router";

export function useCurrentUrl() {
    const route = useRoute();

    function isCurrentUrl(url: string): boolean {
        return route.path === url;
    }

    function whenCurrentUrl(url: string, classes: string): string {
        return isCurrentUrl(url) ? classes : "";
    }

    return { isCurrentUrl, whenCurrentUrl };
}

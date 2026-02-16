import HomeClient from "@/components/HomeClient";
import { showGenericLogo } from "@/lib/flags";

export default async function Home() {
    const isGenericLogoEnabled = await showGenericLogo();

    return <HomeClient showGenericLogo={isGenericLogoEnabled} />;
}

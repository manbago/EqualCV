import HomeClient from "@/components/HomeClient";
import { new_showPhotoStatus, showGenericLogo } from "@/lib/flags";

export default async function Home() {
    const isPhotoStatusEnabled = await new_showPhotoStatus();
    const isGenericLogoEnabled = await showGenericLogo();

    return <HomeClient new_showPhotoStatus={isPhotoStatusEnabled} showGenericLogo={isGenericLogoEnabled} />;
}

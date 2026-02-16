import HomeClient from "@/components/HomeClient";
import { new_showPhotoStatus } from "@/lib/flags";

export default async function Home() {
    const isPhotoStatusEnabled = await new_showPhotoStatus();

    return <HomeClient new_showPhotoStatus={isPhotoStatusEnabled} />;
}

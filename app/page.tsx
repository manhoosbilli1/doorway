import { requireChatGPTUser } from './chatgpt-auth';
import DoorwayClient from './DoorwayClient';
export const dynamic = 'force-dynamic';
export default async function Page() {
 const user = await requireChatGPTUser('/');
 return <DoorwayClient user={{id:user.userId,email:user.email}} />;
}

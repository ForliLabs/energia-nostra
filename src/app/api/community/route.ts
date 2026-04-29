import {
  getCommunityDashboard, createPost, reactToPost, addComment, getComments,
  sendMessage, getMessages, markMessageRead,
  createReferral, trackReferralClick, completeReferral, getReferrals,
} from "@/lib/community";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-bertinoro";
  const userId = searchParams.get("userId") || undefined;
  const view = searchParams.get("view"); // dashboard | comments | messages | referrals

  if (view === "comments") {
    const postId = searchParams.get("postId");
    if (!postId) return Response.json({ error: "Post ID richiesto" }, { status: 400 });
    const comments = await getComments(postId);
    return Response.json({ comments });
  }

  if (view === "messages" && userId) {
    const messages = await getMessages(userId, cerId);
    return Response.json({ messages });
  }

  if (view === "referrals") {
    const referrals = await getReferrals(cerId);
    return Response.json({ referrals });
  }

  const dashboard = await getCommunityDashboard(cerId, userId);
  return Response.json(dashboard);
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action?: string;
    cerId?: string; authorId?: string; authorName?: string;
    type?: string; title?: string; content?: string;
    metadata?: Record<string, unknown>;
    postId?: string; userId?: string; emoji?: string;
    senderId?: string; senderName?: string; recipientId?: string;
    messageId?: string;
    referrerId?: string; referrerName?: string;
    inviteCode?: string; inviteeName?: string; inviteeEmail?: string;
  };

  const cerId = body.cerId || "cer-bertinoro";

  if (body.action === "create-post") {
    if (!body.authorId || !body.authorName || !body.type || !body.content) {
      return Response.json({ error: "Autore, tipo e contenuto richiesti" }, { status: 400 });
    }
    const post = await createPost({
      cerId, authorId: body.authorId, authorName: body.authorName,
      type: body.type, title: body.title, content: body.content, metadata: body.metadata,
    });
    return Response.json({ post }, { status: 201 });
  }

  if (body.action === "react" && body.postId && body.userId) {
    await reactToPost(body.postId, body.userId, body.emoji || "👍");
    return Response.json({ success: true });
  }

  if (body.action === "comment" && body.postId && body.authorId && body.authorName && body.content) {
    const comment = await addComment(body.postId, body.authorId, body.authorName, body.content);
    return Response.json({ comment }, { status: 201 });
  }

  if (body.action === "send-message") {
    if (!body.senderId || !body.senderName || !body.recipientId || !body.content) {
      return Response.json({ error: "Mittente, destinatario e contenuto richiesti" }, { status: 400 });
    }
    const message = await sendMessage({
      cerId, senderId: body.senderId, senderName: body.senderName,
      recipientId: body.recipientId, content: body.content,
    });
    return Response.json({ message }, { status: 201 });
  }

  if (body.action === "mark-read" && body.messageId) {
    await markMessageRead(body.messageId);
    return Response.json({ success: true });
  }

  if (body.action === "create-referral" && body.referrerId && body.referrerName) {
    const referral = await createReferral(cerId, body.referrerId, body.referrerName);
    return Response.json({ referral }, { status: 201 });
  }

  if (body.action === "track-referral" && body.inviteCode) {
    await trackReferralClick(body.inviteCode);
    return Response.json({ success: true });
  }

  if (body.action === "complete-referral" && body.inviteCode && body.inviteeName && body.inviteeEmail) {
    await completeReferral(body.inviteCode, body.inviteeName, body.inviteeEmail);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Azione non riconosciuta" }, { status: 400 });
}

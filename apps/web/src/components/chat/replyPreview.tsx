import type { Message } from 'shared';
import { getDefaultAvatar } from 'shared';

import { useAssetsUrl } from '@/context/assetsUrl';
import { useConfig } from '@/context/configContext';

import renderDfm from './dfm/dfmRenderer';

interface ReplyPreviewProps {
  referencedMessage: Message;
  selectedGuildId?: string | null;
  scrollToMessage: (messageId: string) => Promise<void>;
}

export const ReplyPreview = ({
  referencedMessage,
  scrollToMessage,
  selectedGuildId,
}: ReplyPreviewProps) => {
  const avatarId = referencedMessage.author.avatar;
  const authorId = referencedMessage.author.id;

  const defaultAvatarFilename = getDefaultAvatar(referencedMessage.author) ?? '0';
  const { url: defaultAvatarUrl } = useAssetsUrl(`/assets/${defaultAvatarFilename}.png`);

  const { cdnUrl } = useConfig();
  const avatarUrl = avatarId
    ? `${cdnUrl ?? ''}/avatars/${authorId ?? ''}/${avatarId}.png`
    : defaultAvatarUrl;

  let displayContent = referencedMessage.content ?? '';

  const hasInvite = /\/invite\/[a-zA-Z0-9]+/.exec(displayContent);

  if (hasInvite) {
    displayContent = displayContent.replace(
      /https?:\/\/\S*\/invite\/[a-zA-Z0-9]+\S*/g,
      'Sent an invite',
    );
  } //this needs to catch standard short domain invites with no protocol prefix

  if (referencedMessage.attachments.length > 0) {
    const attachmentText = `(Attachment${referencedMessage.attachments.length > 1 ? 's' : ''})`;
    displayContent = displayContent.trim() ? `${displayContent} ${attachmentText}` : attachmentText;
  }

  if (referencedMessage.content?.endsWith('.gif')) {
    displayContent = `(GifResult)`;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      void scrollToMessage(referencedMessage.id);
    }
  };

  return (
    <div
      className='message-reply-preview'
      role='button'
      tabIndex={0}
      onClick={() => {
        void scrollToMessage(referencedMessage.id);
      }}
      onKeyDown={handleKeyDown}
    >
      <div className='reply-spine'></div>
      <img src={avatarUrl} className='reply-avatar avatar-img' alt='' />
      <span className='reply-author'>
        {referencedMessage.author.global_name ?? referencedMessage.author.username}
      </span>
      <div className='reply-content'>{renderDfm(displayContent, selectedGuildId ?? undefined)}</div>
    </div>
  );
};

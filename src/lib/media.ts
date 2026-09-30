/** YouTube video id from a watch, short or embed URL; null for anything else. */
export function youtubeId(url: string | null | undefined): string | null {
  const m = url?.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube(?:-nocookie)?\.com\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** Poster frame served by YouTube for a video id. */
export const youtubePoster = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** Privacy-enhanced embed URL (no cookies until the viewer presses play). */
export const youtubeEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?rel=0`;

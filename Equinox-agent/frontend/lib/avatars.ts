export type MemberName = "Alice" | "Bob" | "Charlie" | "Dave";

export interface AvatarDef {
  emoji: string;
  bg: string;
}

export const AVATARS: Record<MemberName, AvatarDef> = {
  Alice: {
    emoji: "🦊",
    bg: "linear-gradient(135deg, #6a5cf4 0%, #4a3bcd 100%)",
  },
  Bob: {
    emoji: "🐻",
    bg: "linear-gradient(135deg, #d9a23a 0%, #966315 100%)",
  },
  Charlie: {
    emoji: "🐸",
    bg: "linear-gradient(135deg, #2dba9c 0%, #0a6b58 100%)",
  },
  Dave: {
    emoji: "🐱",
    bg: "linear-gradient(135deg, #d24f8b 0%, #7c2752 100%)",
  },
};

// StoryChain Custom Book ID System
// Replaces ISBN with SC-YYYY-XXXXX format
// Format: SC-2025-12345 (StoryChain-Year-5DigitSequence)

export function generateBookId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `SC-${year}-${random}`;
}

export function generateEditionId(baseId: string, edition: number): string {
  return `${baseId}-E${edition}`;
}

export function parseBookId(bookId: string): {
  valid: boolean;
  year?: number;
  sequence?: number;
  edition?: number;
} {
  const pattern = /^SC-(\d{4})-(\d{5})(?:-E(\d+))?$/;
  const match = bookId.match(pattern);
  
  if (!match) {
    return { valid: false };
  }
  
  return {
    valid: true,
    year: parseInt(match[1]),
    sequence: parseInt(match[2]),
    edition: match[3] ? parseInt(match[3]) : 1
  };
}

export function validateBookId(bookId: string): boolean {
  return parseBookId(bookId).valid;
}

// Generate a version ID for updates
export function generateVersionId(major: number, minor: number, patch: number): string {
  return `${major}.${minor}.${patch}`;
}

// Blockchain-ready ID format (for Celo integration)
export function generateBlockchainId(bookId: string): string {
  // Returns a bytes32 compatible identifier
  // Keccak256 hash of the book ID, or use book ID directly if within 32 bytes
  return `0x${Buffer.from(bookId).toString('hex').padEnd(64, '0')}`;
}

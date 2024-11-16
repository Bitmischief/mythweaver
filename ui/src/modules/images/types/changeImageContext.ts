export interface ChangeImageContext {
  currentImageId?: number;
  link: ChangeImageContextLink;
}

export interface ChangeImageContextLink {
  conjurationId?: number;
  sessionId?: number;
}

export interface JwtPayload {
  sub: string;
  id: string;
  username: string;
  email: string;
  name: string;
  workspaceIds: Array<string>;
  createdAt: string;
  updatedAt: string;
  iat?: number;
  exp?: number;
}

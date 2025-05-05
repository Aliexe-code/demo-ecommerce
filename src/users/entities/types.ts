export interface JWTPayloadType {
  id: string;
  email: string;

  iat?: number;
  exp?: number;
}

export interface UserResponse {
  message: string;
  userData: {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
  token?: string;
}

export interface Response {
  message: string;
  error?: string;
  [key: string]: any;
}

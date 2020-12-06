/// <reference types="react-scripts" />

declare namespace NodeJS {
  export interface ProcessEnv {
    REACT_APP_CLOCKIFY_SECRET_KEY: string;
  }
}

type TAPIError<TData> = import("axios").AxiosError<TData>;
type TAPIResponse<TData> = import("axios").AxiosResponse<TData>;

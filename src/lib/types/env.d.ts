declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      DATABASE_URL_UNPOOLED: string;
      PGHOST: string;
      PGHOST_UNPOOLED: string;
      PGUSER: string;
      PGDATABASE: string;
      PGPASSWORD: string;
      POSTGRES_URL: string;
      POSTGRES_URL_NON_POOLING: string;
      POSTGRES_USER: string;
      POSTGRES_HOST: string;
      POSTGRES_PASSWORD: string;
      POSTGRES_DATABASE: string;
      POSTGRES_URL_NO_SSL: string;
      POSTGRES_PRISMA_URL: string;
      BLOB_READ_WRITE_TOKEN: string;
    }
  }
}

export {};

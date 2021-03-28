import { ReactElement } from "react";
import { GetServerSideProps } from "next";
import nc from "next-connect";
import session from "cookie-session";
import { IncomingMessage } from "http";
import styles from "../styles/Home.module.css";

// https://www.strava.com/oauth/authorize?client_id=63782&redirect_uri=http://localhost:3000&response_type=code&scope=read_all
export default function Home(): ReactElement {
  return <div className={styles.container}>Test</div>;
}
interface Session {
  session?: {
    accessToken: string;
  };
}

interface IncomingMessageWithSession extends IncomingMessage, Session {}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { res, query } = context;
  const req = context.req as IncomingMessageWithSession;
  const handler = nc().use(
    session({ secret: process.env.SESSION_COOKIE_SECRET })
  );
  try {
    await handler.run(req, res);
    // TODO move the following into an auth middleware as per https://www.npmjs.com/package/next-connect#user-content-runreq-res
    if (!req.session?.accessToken) {
      if (query.code) {
        const { STRAVA_CLIENT_SECRET, STRAVA_CLIENT_ID } = process.env;
        const token = await fetch(
          `https://www.strava.com/api/v3/oauth/token?client_secret=${STRAVA_CLIENT_SECRET}&client_id=${STRAVA_CLIENT_ID}&code=${query.code}&grant_type=authorization_code`,
          { method: "post" }
        );
        const data = await token.json();
        req.session = {
          accessToken: data.access_token,
        };
        if (data.errors) {
          throw new Error(JSON.stringify(data.errors));
        }
      }
    } else {
      console.log("access token present!");
    }
  } catch (e) {
    console.log("error", e);
  }

  return {
    props: {
      accessToken: "test",
    },
  };
};

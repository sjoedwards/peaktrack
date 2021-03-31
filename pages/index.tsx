import { ReactElement } from "react";
import { GetServerSideProps } from "next";
import Link from "next/link";
import nc from "next-connect";
import session from "cookie-session";
import { IncomingMessage } from "http";
import styles from "../styles/Home.module.css";

interface HomeProps {
  strava: {
    loggedIn: boolean;
  };
  spotify: {
    loggedIn: boolean;
  };
}

export default function Home({ strava, spotify }: HomeProps): ReactElement {
  return (
    <div>
      {!strava.loggedIn ? (
        <Link href="https://www.strava.com/oauth/authorize?client_id=63782&redirect_uri=http://localhost:3000&response_type=code&scope=read_all">
          <button type="button" className={styles.button}>
            Log In to Strava
          </button>
        </Link>
      ) : (
        <div>
          <span>Authenticated with strava</span>
        </div>
      )}
      {!spotify.loggedIn ? (
        <Link href="https://accounts.spotify.com/authorize?client_id=2980bc524d8249978ce2796c88006256&response_type=code&redirect_uri=http://localhost:3000?auth=spotify&scope=user-read-private%20user-read-email">
          <button type="button" className={styles.button}>
            Log In to Spotify
          </button>
        </Link>
      ) : (
        <div>
          <span>Authenticated with spotify</span>
        </div>
      )}
    </div>
  );
}
interface Session {
  session?: {
    strava?: {
      accessToken?: string;
    };
    spotify?: {
      accessToken?: string;
    };
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
    if (!req.session?.strava?.accessToken) {
      if (query.code) {
        const { STRAVA_CLIENT_SECRET, STRAVA_CLIENT_ID } = process.env;
        const token = await fetch(
          `https://www.strava.com/api/v3/oauth/token?client_secret=${STRAVA_CLIENT_SECRET}&client_id=${STRAVA_CLIENT_ID}&code=${query.code}&grant_type=authorization_code`,
          { method: "post" }
        );
        const data = await token.json();
        req.session = {
          ...req.session,
          strava: {
            accessToken: data.access_token,
          },
        };
        if (data.errors) {
          throw new Error(JSON.stringify(data.errors));
        }
      }
    }
    if (!req.session?.spotify?.accessToken) {
      if (query.code) {
        const { SPOTIFY_CLIENT_SECRET, SPOTIFY_CLIENT_ID } = process.env;

        const token = await fetch("https://accounts.spotify.com/api/token", {
          body: `grant_type=authorization_code&code=${query.code}&redirect_uri=http%3A%2F%2Flocalhost%3A3000%3Fauth%3Dspotify`,
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
            ).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        });

        const data = await token.json();
        req.session = {
          ...req.session,
          spotify: {
            accessToken: data.access_token,
          },
        };
        if (data.errors) {
          throw new Error(JSON.stringify(data.errors));
        }
      }
    }
  } catch (e) {
    console.log("error", e);
  }
  return {
    props: {
      strava: {
        loggedIn: Boolean(req.session?.strava?.accessToken),
      },
      spotify: {
        loggedIn: Boolean(req.session?.spotify?.accessToken),
      },
    },
  };
};

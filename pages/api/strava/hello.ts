import type { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import session from "cookie-session";

interface Session {
  session: {
    accessToken: string;
  };
}

export default nc<Session, NextApiResponse>()
  .use(session({ secret: process.env.SESSION_COOKIE_SECRET }))
  .get((req, res): void => {
    const { accessToken } = req.session;
    if (!accessToken) {
      console.log("Unauthorized");
      return res.status(401).end();
    }

    console.log(`Access Token: ${accessToken}`);
    return res.end();
  });

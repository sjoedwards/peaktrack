import type { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import session from "cookie-session";

interface ExtendedRequest {
  session: {
    accessToken: string;
  };
}

export default nc<ExtendedRequest, NextApiResponse>()
  .use(session({ secret: process.env.SESSION_COOKIE_SECRET }))
  .get((req, res): void => {
    req.session = {
      accessToken: "test",
    };
    return res.end();
  });

// https://www.strava.com/oauth/authorize?client_id=63782&redirect_uri=http://localhost:3000&response_type=code&scope=read_all

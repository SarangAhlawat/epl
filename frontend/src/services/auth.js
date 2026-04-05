import API from "./api";

export const loginPassword = async (

  email,
  password

) => {

  return API.post(

    "/auth/login-password",

    {

      email,
      password

    }

  );

};

export const sendOTP = async (

  email

) => {

  return API.post(

    "/auth/send-otp",

    null,

    {

      params: { email }

    }

  );

};

export const verifyOTP = async (

  email,
  otp

) => {

  return API.post(

    "/auth/verify-otp",

    null,

    {

      params: {

        email,
        otp

      }

    }

  );

};

export const loginOTP = async (

  email,
  otp

) => {

  return API.post(

    "/auth/login-otp",

    null,

    {

      params: {

        email,
        otp

      }

    }

  );

};
import Button from "../../components/button/button";
import Input from "../../components/input/input";
import Footer from "../../components/footer/footer";
import { Form, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { SERVER_URL } from "../../config";
import "./login.css";

function Login() {
  const navigate = useNavigate();
  const [validEmail, setEmail] = useState(false);
  const [validPassword, setPassword] = useState(false);

  useEffect(() => {
    const email = document.querySelector("#email");
    const password = document.querySelector("#password");
    let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    email.addEventListener("input", () => {
      if (regex.test(email.value)) setEmail(true);
      else setEmail(false);
    });
    password.addEventListener("input", () => {
      if (password.value.length < 5) setPassword(false);
      else setPassword(true);
    });
  });

  const loginClick = async () => {
    if (validEmail && validPassword) {
      const email = document.querySelector("#email").value.trim();
      const password = document.querySelector("#password").value.trim();
      const response = await apiLogin(email, password);
      if (response.status === "success") {
        localStorage.setItem("userData", JSON.stringify(response.data));
        window.toast("success", "Welcome to DarkZon");
        navigate("/");
      } else {
        window.toast("error", response.message);
      }
    } else if (validEmail) {
      window.toast("invalid", "Password must be 5 letters at least");
    } else {
      window.toast(
        "invalid",
        "Email must be in this format => example@gmail.com",
      );
    }
  };

  const apiLogin = async (email, password) => {
    return fetch(`${SERVER_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((data) => data);
  };
  return (
    <div className="row main-login">
      <div className="col-md-6 col-lg-6 col-12 p-0">
        <div className="intro d-flex justify-content-center align-items-center flex-column gap-2 p-5 text-center">
          <Link className="rounded-pill fw-bold go-to-home" to="/">
            &lt;- Home
          </Link>
          <h1 className="fw-bold fs-1">Welcome To DarkZon</h1>
          <p className="text-white-50">
            The best place to find whatever you want with the best prices go and
            have your journey
          </p>
        </div>
      </div>
      <div className="col-md-6 col-lg-6 col-12 p-0 d-flex align-items-center">
        <div
          className="m-auto py-5 px-3 d-flex flex-column align-items-center gap-3"
          id="login"
        >
          <h1 className="fw-bold">Login</h1>
          <Input placeholder="Email" type="Email" id="email"></Input>
          <Input placeholder="Password" type="Password" id="password"></Input>
          <Button text="Login" id="login-btn" onclick={loginClick}></Button>
          <div>
            Don't have account ?{" "}
            <Link className="fw-bold" to="/register">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

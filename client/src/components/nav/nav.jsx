import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./nav.css";
import Input from "../input/input";

function Nav() {
  return (
    <>
      <nav className="navbar navbar-expand-lg sticky-top">
        <div className="container-fluid">
          <Link className="navbar-brand fw-bold fs-3" to="/">
            DarkZon
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <div className="icon">
              <i className="fa-solid fa-bars"></i>
            </div>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 me-2 gap-1">
              <li className="nav-item ">
                <Link
                  className="nav-link active rounded-pill"
                  aria-current="page"
                  to="/"
                >
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link rounded-pill" to="/product">
                  Products
                </Link>
              </li>
              <li className="nav-item ">
                <Link className="nav-link rounded-pill" to="/contact">
                  Contact Us
                </Link>
              </li>
            </ul>
            <form
              className="d-flex align-items-center gap-1 search mb-3 mb-lg-0"
              role="search"
            >
              <div className="fs-5">
                <i className="fa-solid fa-magnifying-glass"></i>
              </div>
              <Input placeholder="Search For Products" type="search"></Input>
            </form>
            <ul className="navbar-nav mb-2 mb-lg-0 me-2 gap-1">
              <li className="nav-item rounded-pill">
                <Link className="nav-link" to="/cart">
                  <span className="fs-4 me-1">
                    <i className="fa-solid fa-cart-shopping "></i>
                  </span>
                  <span className="d-lg-none">Cart</span>
                </Link>
              </li>
              <li className="nav-item  rounded-pill">
                <Link className="nav-link" to="/login">
                  <span className="fs-4 me-lg-none me-1">
                    <i className="fa-solid fa-circle-user"></i>
                  </span>
                  <span className="d-lg-none">Profile</span>
                </Link>
              </li>
              <li className="nav-item  rounded-pill">
                <Link className="nav-link" to="/history">
                  <span className="fs-4 me-lg-none me-1">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                  </span>
                  <span className="d-lg-none">History</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Nav;

import React from "react";
import { FaDiscord, FaTelegramPlane, FaTwitter } from "react-icons/fa";

const Footer = () => {
  return (
    <div className="footer-trade-tables d-flex flex-column flex-lg-row text-center justify-content-center justify-content-lg-around">
      <div className="mt-3 mt-lg-0 d-flex align-items-center justify-content-center">Powered By Dexpresso</div>
      <div className="mt-3 mt-lg-0 d-flex align-items-center justify-content-center">
        <p>v1.1.0</p>{" "}
      </div>
      <div className="head_left_socials my-1 my-lg-0 footer-icons">
        {" "}
        <ul>
          <li className="head_social_link">
            <a target="_blank" rel="noreferrer" href="#">
              <FaTwitter />
            </a>
          </li>
          <li className="head_social_link">
            <a target="_blank" rel="noreferrer" href="#">
              <FaTelegramPlane />
            </a>
          </li>
          <li className="head_social_link">
            <a target="_blank" rel="noreferrer" href="#">
              <FaDiscord />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Footer;

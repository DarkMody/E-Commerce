import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SERVER_URL } from "../../config";
import "./card.css";

function Card(param) {
  const product = param.product;
  const people = product.people;
  return (
    <div className="card text-start pt-2 " id={product.p_id}>
      <div className="d-flex align-items-center justify-content-center image">
        <img
          src={`${SERVER_URL}/uploads/${product.image}`}
          className="card-img-top"
          alt="#"
        />
      </div>
      <div className="card-body d-flex flex-column justify-content-end">
        <h4 className="card-title">{product.name}</h4>
        <div className="rate d-flex justify-content-center align-items-center gap-1 mb-2">
          <div className="fs-6">
            <i className="fa-solid fa-star"></i>
          </div>
          <div>{product.rate}</div>
          <div>({Math.round((product.people * 100) / 100)})</div>
        </div>
        <div className="price-stock d-flex justify-content-between align-items-center">
          <div className="price fw-bold fs-4">${product.price}</div>
          {product.quantity == 0 ? (
            <div className="stock fw-bold fs-6 p-2">Out of Stock</div>
          ) : param.sellerPage ? (
            <div className="fw-bold fs-6 p-2">
              Remaining : {product.quantity}
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
}

export default Card;

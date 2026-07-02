import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./card.css";

function Card(param) {
  const product = param.product;
  return (
    <div className="card text-start pt-2 " id={product.id}>
      <div className="d-flex align-items-center justify-content-center image">
        <img src={product.image} className="card-img-top" alt="#" />
      </div>
      <div className="card-body d-flex flex-column justify-content-end">
        <h4 className="card-title">{product.title}</h4>
        <div className="rate d-flex justify-content-center align-items-center gap-1 mb-2">
          <div className="fs-6">
            <i className="fa-solid fa-star"></i>
          </div>
          <div>{product.rating.rate}</div>
          <div>({product.rating.count})</div>
        </div>
        <div className="price fw-bold fs-4">${product.price}</div>
      </div>
    </div>
  );
}

export default Card;

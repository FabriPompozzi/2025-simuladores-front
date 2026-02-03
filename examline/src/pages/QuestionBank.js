import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import BackToMainButton from "../components/BackToMainButton";

const QuestionBank = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="modern-card mb-4">
        <div className="modern-card-header">
          <div className="exam-creator-header">
            <div className="exam-creator-title-section">
              <h1 className="page-title mb-1">
                <i className="fas fa-database me-2" style={{ color: 'var(--primary-color)' }}></i>
                <span className="title-text">Banco de Preguntas</span>
              </h1>
              <p className="page-subtitle mb-0">Gestiona y reutiliza preguntas para tus exámenes</p>
            </div>
            <div className="exam-creator-actions">
              <BackToMainButton />
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="modern-card">
        <div className="modern-card-header">
          <h3 className="modern-card-title">
            <i className="fas fa-list me-2"></i>
            Mis Preguntas Guardadas
          </h3>
        </div>
        <div className="modern-card-body">
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-database"></i>
            </div>
            <h4 className="empty-title">Banco de preguntas</h4>
            <p className="empty-subtitle">
              Esta funcionalidad estará disponible próximamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionBank;

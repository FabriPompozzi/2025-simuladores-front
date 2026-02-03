import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import BackToMainButton from "../components/BackToMainButton";
import QuestionCreator from "../components/QuestionCreator";
import Modal from "../components/Modal";
import { useModal } from "../hooks";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

const QuestionBank = () => {
  const navigate = useNavigate();
  const { modal, showModal, closeModal } = useModal();
  const [questions, setQuestions] = useState([]);
  const [showCreator, setShowCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Cargar preguntas del banco al montar el componente
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(""); // Limpiar errores previos
      const token = localStorage.getItem("token");
      
      console.log("🔍 Cargando preguntas desde:", `${API_BASE_URL}/question-bank`);
      console.log("🔑 Token:", token ? "presente" : "ausente");
      
      const response = await fetch(`${API_BASE_URL}/question-bank`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📡 Respuesta del servidor:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Error del servidor:", errorData);
        throw new Error(errorData.error || "Error al cargar preguntas");
      }

      const data = await response.json();
      console.log("✅ Preguntas cargadas:", data);
      setQuestions(data);
    } catch (err) {
      const errorMessage = err.message || "Error al cargar las preguntas del banco";
      setError(errorMessage);
      console.error("❌ Error completo:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (questionData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/question-bank`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) {
        throw new Error("Error al guardar pregunta");
      }

      const newQuestion = await response.json();
      setQuestions([newQuestion, ...questions]);
      setSuccessMessage("Pregunta guardada exitosamente");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Error al guardar la pregunta");
      console.error(err);
    }
  };

  const handleDeleteQuestion = (questionId) => {
    showModal(
      "error",
      "Eliminar Pregunta",
      "¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no se puede deshacer.",
      async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`${API_BASE_URL}/question-bank/${questionId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Error al eliminar pregunta");
          }

          setQuestions(questions.filter((q) => q.id !== questionId));
          setSuccessMessage("Pregunta eliminada exitosamente");
          setTimeout(() => setSuccessMessage(""), 3000);
          closeModal();
        } catch (err) {
          setError("Error al eliminar la pregunta");
          console.error(err);
          closeModal();
        }
      },
      true
    );
  };

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

      {/* Mensajes */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {successMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage("")}
          ></button>
        </div>
      )}

      {/* Menú desplegable para crear preguntas */}
      <div className="modern-card mb-4">
        <div className="modern-card-header" style={{ cursor: 'pointer' }} onClick={() => setShowCreator(!showCreator)}>
          <h3 className="modern-card-title d-flex justify-content-between align-items-center">
            <span>
              <i className="fas fa-plus-circle me-2"></i>
              {showCreator ? 'Ocultar' : 'Crear'} Nueva Pregunta
            </span>
            <i className={`fas fa-chevron-${showCreator ? 'up' : 'down'}`}></i>
          </h3>
        </div>
        {showCreator && (
          <div className="modern-card-body p-0">
            <QuestionCreator onAddQuestion={handleAddQuestion} />
          </div>
        )}
      </div>

      {/* Lista de Preguntas Guardadas */}
      <div className="modern-card">
        <div className="modern-card-header">
          <h3 className="modern-card-title">
            <i className="fas fa-list me-2"></i>
            Mis Preguntas Guardadas ({questions.length})
          </h3>
        </div>
        <div className="modern-card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : questions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-database"></i>
              </div>
              <h4 className="empty-title">No hay preguntas guardadas</h4>
              <p className="empty-subtitle">
                Crea tu primera pregunta usando el formulario de arriba
              </p>
            </div>
          ) : (
            <div className="questions-list">
              {questions.map((question, index) => (
                <div key={question.id} className="modern-card mb-3" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div className="modern-card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="mb-0">
                        <i className="fas fa-question-circle me-2 text-primary"></i>
                        Pregunta #{index + 1}
                      </h5>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteQuestion(question.id)}
                        title="Eliminar pregunta"
                      >
                        <i className="fas fa-trash me-1"></i>
                        Eliminar
                      </button>
                    </div>
                    <p className="mb-3" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                      {question.texto}
                    </p>
                    <div className="mb-2">
                      <strong className="text-muted">Opciones:</strong>
                    </div>
                    <ul className="list-group mb-3">
                      {Array.isArray(question.opciones) ? (
                        question.opciones.map((opcion, i) => (
                          <li
                            key={i}
                            className={`list-group-item ${
                              i === question.correcta ? 'list-group-item-success' : ''
                            }`}
                          >
                            {i === question.correcta && (
                              <i className="fas fa-check-circle me-2 text-success"></i>
                            )}
                            <strong>Opción {i + 1}:</strong> {opcion}
                          </li>
                        ))
                      ) : (
                        <li className="list-group-item">Error: formato de opciones inválido</li>
                      )}
                    </ul>
                    <div className="text-muted small">
                      <i className="fas fa-calendar me-2"></i>
                      Creada: {new Date(question.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      <Modal
        show={modal.show}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText}
        showCancel={modal.showCancel}
        isProcessing={modal.isProcessing}
      />
    </div>
  );
};

export default QuestionBank;

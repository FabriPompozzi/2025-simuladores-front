// src/components/QuestionCreator.jsx
import React, { useState } from "react";

const QuestionCreator = ({ onAddQuestion }) => {
  const [textoPregunta, setTextoPregunta] = useState("");
  const [opciones, setOpciones] = useState(["", ""]);
  const [correcta, setCorrecta] = useState(0);
  const [error, setError] = useState("");

  // Agregar opción nueva
  const handleAgregarOpcion = () => {
    if (opciones.length < 10) { // Máximo 10 opciones
      setOpciones([...opciones, ""]);
    }
  };

  // Eliminar opción
  const handleEliminarOpcion = (index) => {
    if (opciones.length > 2) { // Mínimo 2 opciones
      const nuevasOpciones = opciones.filter((_, i) => i !== index);
      setOpciones(nuevasOpciones);
      // Ajustar la respuesta correcta si es necesario
      if (correcta >= nuevasOpciones.length) {
        setCorrecta(nuevasOpciones.length - 1);
      }
    }
  };

  // Agregar pregunta al listado
  const handleAgregarPregunta = () => {
    if (!textoPregunta.trim()) {
      setError("Ingrese el texto de la pregunta");
      return;
    }
    
    if (opciones.length < 2) {
      setError("La pregunta debe tener al menos 2 opciones");
      return;
    }
    
    if (opciones.some(o => !o.trim())) {
      setError("Complete todas las opciones antes de agregar la pregunta");
      return;
    }

    // Llamar al callback del padre con la nueva pregunta
    onAddQuestion({
      texto: textoPregunta,
      opciones: [...opciones],
      correcta
    });

    // Limpiar inputs
    setTextoPregunta("");
    setOpciones(["", ""]);
    setCorrecta(0);
    setError("");
  };

  return (
    <div className="modern-card mb-4">
      <div className="modern-card-header">
        <h3 className="modern-card-title">
          <i className="fas fa-question-circle me-2"></i>
          Agregar Pregunta
        </h3>
      </div>
      <div className="modern-card-body">
        {error && (
          <div className="error-message mb-3">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="form-label d-flex align-items-center gap-2">
            <i className="fas fa-comment-alt text-muted"></i>
            Texto de la pregunta
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Escribe aquí tu pregunta"
            value={textoPregunta}
            onChange={(e) => setTextoPregunta(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div className="mb-4">
          <label className="form-label d-flex align-items-center gap-2">
            <i className="fas fa-list text-muted"></i>
            Opciones de respuesta (mínimo 2, máximo 10)
          </label>
          <div className="exam-creator-options-list">
            {opciones.map((op, i) => (
              <div key={i} className="exam-creator-option-item mb-2 d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Opción ${i + 1}`}
                  value={op}
                  onChange={(e) => {
                    const nuevasOpciones = [...opciones];
                    nuevasOpciones[i] = e.target.value;
                    setOpciones(nuevasOpciones);
                  }}
                  style={{
                    padding: '0.6rem 0.8rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                />
                {opciones.length > 2 && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleEliminarOpcion(i)}
                    title="Eliminar opción"
                    style={{ minWidth: '40px' }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
          {opciones.length < 10 && (
            <button
              type="button"
              className="btn btn-outline-primary btn-sm mt-2"
              onClick={handleAgregarOpcion}
            >
              <i className="fas fa-plus me-2"></i>
              Agregar opción
            </button>
          )}
        </div>

        <div className="mb-4">
          <label className="form-label d-flex align-items-center gap-2">
            <i className="fas fa-check-circle text-muted"></i>
            Respuesta correcta
          </label>
          <select
            className="form-select"
            value={correcta}
            onChange={(e) => setCorrecta(Number(e.target.value))}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          >
            {opciones.map((_, i) => (
              <option key={i} value={i}>
                Opción {i + 1}
              </option>
            ))}
          </select>
        </div>

        <div className="exam-creator-buttons">
          <button 
            className="modern-btn modern-btn-secondary"
            onClick={handleAgregarPregunta}
          >
            <i className="fas fa-plus me-2"></i>
            <span className="button-text">Agregar Pregunta</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionCreator;

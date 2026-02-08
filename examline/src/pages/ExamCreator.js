// src/pages/ExamCreator.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { useModal } from "../hooks";
import BackToMainButton from "../components/BackToMainButton";
import Modal from "../components/Modal";
import QuestionCreator from "../components/QuestionCreator";
import QuestionBankSelector from "../components/QuestionBankSelector";
import { createExam } from "../services/api";

const ExamCreator = () => {
  const navigate = useNavigate();
  const { modal, showModal, closeModal } = useModal();
  const [titulo, setTitulo] = useState("");
  const [tipoExamen, setTipoExamen] = useState("multiple_choice"); // "multiple_choice" | "programming"
  const [ordenAleatorio, setOrdenAleatorio] = useState(false); // Orden aleatorio de preguntas
  
  // Estados para exámenes de multiple choice
  const [preguntas, setPreguntas] = useState([]);
  
  // Estados para exámenes de programación
  const [lenguajeProgramacion, setLenguajeProgramacion] = useState("python");
  const [intellisenseHabilitado, setIntellisenseHabilitado] = useState(false);
  const [enunciadoProgramacion, setEnunciadoProgramacion] = useState("");
  const [codigoInicial, setCodigoInicial] = useState("");
  const [testCases, setTestCases] = useState([
    { description: "", input: "", expectedOutput: "" }
  ]);
  
  const [error, setError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [showBankSelector, setShowBankSelector] = useState(false);

  // Agregar pregunta al listado (callback para el componente hijo)
  const handleAddQuestion = (nuevaPregunta) => {
    setPreguntas([...preguntas, nuevaPregunta]);
  };

  // Agregar preguntas desde el banco
  const handleAddQuestionsFromBank = (selectedQuestions) => {
    setPreguntas([...preguntas, ...selectedQuestions]);
  };

  // Eliminar pregunta del examen
  const handleRemoveQuestion = (index) => {
    setPreguntas(preguntas.filter((_, i) => i !== index));
  };

  // Funciones para manejar test cases
  const handleAddTestCase = () => {
    setTestCases([...testCases, { description: "", input: "", expectedOutput: "" }]);
  };

  const handleRemoveTestCase = (index) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    }
  };

  const handleTestCaseChange = (index, field, value) => {
    const updatedTestCases = [...testCases];
    updatedTestCases[index][field] = value;
    setTestCases(updatedTestCases);
  };

  // Función que realmente publica el examen
  const proceedWithPublishing = async () => {
    setIsPublishing(true);
    try {
      const examData = {
        titulo,
        tipo: tipoExamen,
        ordenAleatorio
      };

      // Agregar datos específicos según el tipo
      if (tipoExamen === "multiple_choice") {
        examData.preguntas = preguntas;
      } else if (tipoExamen === "programming") {
        examData.lenguajeProgramacion = lenguajeProgramacion;
        examData.intellisenseHabilitado = intellisenseHabilitado;
        examData.enunciadoProgramacion = enunciadoProgramacion;
        examData.codigoInicial = codigoInicial;
        examData.testCases = testCases;
      }

      await createExam(examData);
      
      // Volver a la Página Principal
      navigate("/principal");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  // Publicar examen
  const handlePublicarExamen = async () => {
    if (isPublishing) return; // Prevenir múltiples clicks
    
    if (!titulo) {
      setError("Ingrese un título para el examen");
      return;
    }

    // Validaciones específicas según el tipo
    if (tipoExamen === "multiple_choice") {
      if (preguntas.length === 0) {
        showModal(
          'warning',
          '⚠️ No se puede publicar el examen',
          'No se puede publicar un examen sin preguntas. Por favor, agrega al menos una pregunta antes de continuar.',
          null,
          false
        );
        return;
      }
    } else if (tipoExamen === "programming") {
      if (!enunciadoProgramacion.trim()) {
        showModal(
          'warning',
          '⚠️ No se puede publicar el examen',
          'No se puede publicar un examen de programación sin consigna. Por favor, ingresa el enunciado del problema antes de continuar.',
          null,
          false
        );
        return;
      }
    }

    // Si llegamos aquí, todo está bien, publicar directamente
    proceedWithPublishing();
  };

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="modern-card mb-4">
        <div className="modern-card-header">
          <div className="exam-creator-header">
            <div className="exam-creator-title-section">
              <h1 className="page-title mb-1">
                <i className="fas fa-plus-circle me-2" style={{ color: 'var(--primary-color)' }}></i>
                <span className="title-text">Crear Examen</span>
              </h1>
              <p className="page-subtitle mb-0">Diseña un nuevo examen con preguntas personalizadas</p>
            </div>
            <div className="exam-creator-actions">
              <BackToMainButton />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message mb-4">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}


        {/* Información del examen */}
        <div className="modern-card mb-4">
          <div className="modern-card-header">
            <h3 className="modern-card-title">
              <i className="fas fa-edit me-2"></i>
              Información del Examen
            </h3>
          </div>
          <div className="modern-card-body">
            <div className="mb-3">
              <label className="form-label d-flex align-items-center gap-2">
                <i className="fas fa-heading text-muted"></i>
                Título del Examen
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Ingresa el título del examen"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label d-flex align-items-center gap-2">
                <i className="fas fa-clipboard-list text-muted"></i>
                Tipo de Examen
              </label>
              <select
                className="form-select"
                value={tipoExamen}
                onChange={(e) => setTipoExamen(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              >
                <option value="multiple_choice">Preguntas</option>
                <option value="programming">Programación</option>
              </select>
            </div>
            
            <div className="mb-0">
              <label className="form-label d-flex align-items-center gap-2">
                <i className="fas fa-random text-muted"></i>
                Orden Aleatorio de Preguntas
              </label>
              <div className="form-check form-switch mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="ordenAleatorioSwitch"
                  checked={ordenAleatorio}
                  onChange={(e) => setOrdenAleatorio(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="ordenAleatorioSwitch">
                  {ordenAleatorio ? "Las preguntas aparecerán en orden aleatorio para cada estudiante" : "Las preguntas aparecerán en el orden definido"}
                </label>
              </div>
              <small className="form-text text-muted">
                {ordenAleatorio 
                  ? "✓ Cada estudiante verá las preguntas en un orden diferente"
                  : "Las preguntas siempre aparecerán en el mismo orden"}
              </small>
            </div>
          </div>
        </div>

        {/* Configuración de examen de programación */}
        {tipoExamen === "programming" && (
          <div className="modern-card mb-4">
            <div className="modern-card-header">
              <h3 className="modern-card-title">
                <i className="fas fa-code me-2"></i>
                Configuración de Programación
              </h3>
            </div>
            <div className="modern-card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label d-flex align-items-center gap-2">
                    <i className="fas fa-terminal text-muted"></i>
                    Lenguaje de Programación
                  </label>
                  <select
                    className="form-select"
                    value={lenguajeProgramacion}
                    onChange={(e) => setLenguajeProgramacion(e.target.value)}
                    style={{
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="form-label d-flex align-items-center gap-2">
                    <i className="fas fa-lightbulb text-muted"></i>
                    Intellisense y Autocompletado
                  </label>
                  <div className="form-check form-switch mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="intellisenseSwitch"
                      checked={intellisenseHabilitado}
                      onChange={(e) => setIntellisenseHabilitado(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="intellisenseSwitch">
                      {intellisenseHabilitado ? "Habilitado" : "Deshabilitado"}
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label d-flex align-items-center gap-2">
                  <i className="fas fa-file-alt text-muted"></i>
                  Enunciado del Problema
                </label>
                <textarea
                  className="form-control"
                  rows="6"
                  placeholder="Describe detalladamente el problema que deben resolver los estudiantes..."
                  value={enunciadoProgramacion}
                  onChange={(e) => setEnunciadoProgramacion(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
              
              <div className="mb-0">
                <label className="form-label d-flex align-items-center gap-2">
                  <i className="fas fa-code text-muted"></i>
                  Código Inicial (Opcional)
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder={`Código inicial para ${lenguajeProgramacion}...`}
                  value={codigoInicial}
                  onChange={(e) => setCodigoInicial(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                    backgroundColor: '#f8f9fa'
                  }}
                />
                <small className="form-text text-muted">
                  Código que aparecerá precargado en el editor del estudiante
                </small>
              </div>
            </div>
          </div>
        )}

        {/* Test Cases para exámenes de programación */}
        {tipoExamen === "programming" && (
          <div className="modern-card mb-4">
            <div className="modern-card-header">
              <h3 className="modern-card-title">
                <i className="fas fa-vial me-2"></i>
                Test Cases (Evaluación Automática)
              </h3>
            </div>
            <div className="modern-card-body">
              <div className="alert alert-info mb-3">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Define los casos de prueba que se ejecutarán automáticamente.</strong>
                <ul className="mb-0 mt-2">
                  <li>Los test cases NO son visibles para los estudiantes</li>
                  <li>El puntaje se calcula como: <strong>(tests pasados / total tests) × 100</strong></li>
                  <li>Ejemplo: 3 de 4 tests correctos = 75%</li>
                </ul>
              </div>

              {testCases.map((testCase, index) => (
                <div key={index} className="card mb-3" style={{ border: '1px solid var(--border-color)' }}>
                  <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: '#f8f9fa' }}>
                    <strong>
                      <i className="fas fa-flask me-2"></i>
                      Test Case {index + 1}
                    </strong>
                    {testCases.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRemoveTestCase(index)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Descripción del Test</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: Suma de números positivos"
                        value={testCase.description}
                        onChange={(e) => handleTestCaseChange(index, 'description', e.target.value)}
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Input (una línea por entrada)</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          placeholder="2&#10;3"
                          value={testCase.input}
                          onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                          style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                        />
                        <small className="form-text text-muted">
                          Deja vacío si el código no requiere input. Cada línea será una entrada separada.
                        </small>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Output Esperado</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          placeholder="5"
                          value={testCase.expectedOutput}
                          onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                          style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                        />
                        <small className="form-text text-muted">
                          Resultado exacto que debe producir el código
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={handleAddTestCase}
              >
                <i className="fas fa-plus me-2"></i>
                Agregar Test Case
              </button>

              <div className="alert alert-success mt-3 mb-0">
                <i className="fas fa-calculator me-2"></i>
                <strong>Total: {testCases.length} test case{testCases.length !== 1 ? 's' : ''}</strong>
                <br/>
                <small>
                  Cada test vale <strong>{testCases.length > 0 ? (100 / testCases.length).toFixed(1) : 0}%</strong> del puntaje final.
                  El puntaje se calcula automáticamente.
                </small>
              </div>
            </div>
          </div>
        )}

        {/* Agregar pregunta - Solo para múltiple choice */}
        {tipoExamen === "multiple_choice" && (
          <>
            <div className="modern-card mb-4">
              <div className="modern-card-header">
                <h3 className="modern-card-title">
                  <i className="fas fa-question-circle me-2"></i>
                  Agregar Preguntas al Examen
                </h3>
              </div>
              <div className="modern-card-body">
                <div className="alert alert-info mb-3">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Tienes dos opciones:</strong> crear una pregunta nueva desde cero o seleccionar preguntas guardadas en tu banco de preguntas.
                </div>
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <button
                    className="modern-btn modern-btn-primary"
                    onClick={() => setShowBankSelector(true)}
                    style={{ minWidth: '250px' }}
                  >
                    <i className="fas fa-database me-2"></i>
                    <span className="button-text">Seleccionar del Banco</span>
                  </button>
                  <div className="text-muted d-flex align-items-center">
                    <strong>o</strong>
                  </div>
                  <button
                    className="modern-btn modern-btn-secondary"
                    onClick={() => {
                      const creator = document.getElementById('question-creator-section');
                      if (creator) creator.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{ minWidth: '250px' }}
                  >
                    <i className="fas fa-plus-circle me-2"></i>
                    <span className="button-text">Crear Pregunta Nueva</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div id="question-creator-section">
              <QuestionCreator onAddQuestion={handleAddQuestion} />
            </div>
          </>
        )}

      {/* Lista de preguntas - Solo para múltiple choice */}
      {tipoExamen === "multiple_choice" && (
        <div className="modern-card">
          <div className="modern-card-header">
            <h3 className="modern-card-title">
              <i className="fas fa-clipboard-list me-2"></i>
              Preguntas Agregadas ({preguntas.length})
            </h3>
          </div>
        <div className="modern-card-body">
          {preguntas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-question-circle"></i>
              </div>
              <h4 className="empty-title">No hay preguntas aún</h4>
              <p className="empty-subtitle">
                Agrega tu primera pregunta usando el formulario de arriba
              </p>
            </div>
          ) : (
            <div className="exam-creator-questions-grid">
              {preguntas.map((p, idx) => (
                <div key={idx} className="exam-creator-question-card">
                  <div className="exam-card">
                    <div className="exam-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div className="d-flex align-items-center gap-2">
                        <h5 className="exam-title mb-0">
                          <span className="question-number">Pregunta {idx + 1}</span>
                        </h5>
                        <span 
                          className="badge"
                          style={{
                            backgroundColor: p.tipo === 'true_false' ? '#28a745' : p.tipo === 'fill_in_blank' ? '#ffc107' : p.tipo === 'matching' ? '#9c27b0' : '#007bff',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.7rem',
                            borderRadius: '4px'
                          }}
                        >
                          <i className={`fas ${p.tipo === 'true_false' ? 'fa-check-double' : p.tipo === 'fill_in_blank' ? 'fa-fill-drip' : p.tipo === 'matching' ? 'fa-arrows-alt-h' : 'fa-list-ul'} me-1`}></i>
                          {p.tipo === 'true_false' ? 'V/F' : p.tipo === 'fill_in_blank' ? 'Completar' : p.tipo === 'matching' ? 'Unir' : 'Múltiple'}
                        </span>
                        <span className="exam-badge">
                          <i className="fas fa-check-circle"></i>
                          <span className="badge-text">Lista</span>
                        </span>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRemoveQuestion(idx)}
                        title="Eliminar pregunta"
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                    <div className="exam-card-body">
                      <div className="question-text mb-3">
                        <strong>{p.texto}</strong>
                      </div>
                      <div className="exam-info">
                        {p.tipo === 'matching' ? (
                          p.opciones.slice(0, p.correcta).map((concepto, i) => {
                            const respuesta = p.opciones[p.correcta + i];
                            return (
                              <div key={i} className="exam-info-item d-flex align-items-center gap-2 mb-2">
                                <span className="badge bg-primary" style={{ fontSize: '0.7rem', minWidth: '25px' }}>
                                  {i + 1}
                                </span>
                                <span style={{ fontSize: '0.85rem' }}>{concepto}</span>
                                <i className="fas fa-arrow-right text-primary" style={{ fontSize: '0.7rem' }}></i>
                                <span className="badge bg-success" style={{ fontSize: '0.7rem', minWidth: '25px' }}>
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span style={{ fontSize: '0.85rem' }}>{respuesta}</span>
                              </div>
                            );
                          })
                        ) : p.tipo === 'fill_in_blank' ? (
                          <>
                            <div className="mb-2">
                              <small className="text-success fw-bold"><i className="fas fa-check-circle me-1"></i>Respuestas correctas (en orden):</small>
                            </div>
                            {p.opciones.slice(0, p.correcta).map((o, i) => (
                              <div key={i} className="exam-info-item">
                                <span className="badge bg-success me-2" style={{ fontSize: '0.7rem' }}>{i + 1}</span>
                                <span className="fw-bold text-success">{o}</span>
                              </div>
                            ))}
                            {p.opciones.length > p.correcta && (
                              <>
                                <div className="mt-2 mb-2">
                                  <small className="text-danger fw-bold"><i className="fas fa-times-circle me-1"></i>Distractores:</small>
                                </div>
                                {p.opciones.slice(p.correcta).map((o, i) => (
                                  <div key={i} className="exam-info-item">
                                    <i className="fas fa-times text-danger"></i>
                                    <span>{o}</span>
                                  </div>
                                ))}
                              </>
                            )}
                          </>
                        ) : (
                          p.opciones.map((o, i) => (
                            <div key={i} className="exam-info-item">
                              <i className={i === p.correcta ? "fas fa-check-circle text-success" : "fas fa-circle text-muted"}></i>
                              <span className={i === p.correcta ? "fw-bold text-success" : ""}>{o}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Botón de publicar examen - al final */}
      <div className="modern-card">
        <div className="modern-card-body">
          <div className="text-center">
            <button 
              className="modern-btn modern-btn-primary"
              onClick={handlePublicarExamen}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  <span className="button-text">Publicando...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane me-2"></i>
                  <span className="button-text">Publicar Examen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Component */}
      <Modal
        show={modal.show}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        showCancel={modal.showCancel}
        confirmText={(modal.type === 'warning') ? 'Confirmar' : 'Entendido'}
        cancelText="Cancelar"
      />

      {/* Question Bank Selector Modal */}
      <QuestionBankSelector
        show={showBankSelector}
        onClose={() => setShowBankSelector(false)}
        onSelectQuestions={handleAddQuestionsFromBank}
      />
    </div>
  );
};

export default ExamCreator;

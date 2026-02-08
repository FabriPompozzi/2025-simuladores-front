import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import '../modern-examline.css';
import { getExamById, API_BASE_URL } from "../services/api";
import { useModal, useSEB } from "../hooks";
import Modal from "../components/Modal";

const ExamAttempt = ({ examId: propExamId, onBack }) => {
  const { examId: routeExamId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examId = propExamId || routeExamId;
  const windowId = searchParams.get('windowId');

  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [respuestas, setRespuestas] = useState({}); // { preguntaIndex: opcionIndex | opcionIndex[] }
  const [randomizedOptions, setRandomizedOptions] = useState({}); // { preguntaIndex: [{ texto, originalIndex }] }
  
  // Usar hooks personalizados
  const { modal, showModal, closeModal, setModalProcessing } = useModal();
  const { isInSEB, tryCloseSEB } = useSEB();

  // 🔒 Validación inicial de seguridad para estudiantes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    
    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
    }

    const token = localStorage.getItem('token');
    if (token && !propExamId) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.rol === 'student' && !windowId && !tokenFromUrl) {
          setError('Acceso no autorizado: Debes acceder desde tus inscripciones');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error validando token:', err);
      }
    }
  }, [windowId, propExamId]);

  // Handle back navigation for errors only
  const handleErrorBack = async () => {
    if (isInSEB) {
      // Intentar cerrar SEB automáticamente
      const closed = await tryCloseSEB();
      
      // Si el usuario canceló (puso "NO"), redirigir a login
      if (!closed) {
        navigate('/login');
      }
    } else {
      if (onBack) {
        onBack();
      } else {
        navigate('/student-exam');
      }
    }
  };

  // Handle exam completion - finish attempt and return
  const handleExamCompletion = () => {
    if (!attempt) {
      // Si no hay intento, navegar directamente
      if (onBack) {
        onBack();
      } else {
        navigate(isInSEB ? '/login' : '/student-exam');
      }
      return;
    }

    // Para exámenes múltiple choice, advertir si no se respondieron todas las preguntas
    if (exam.tipo === 'multiple_choice') {
      const totalPreguntas = exam.preguntas?.length || 0;
      const preguntasRespondidas = Object.keys(respuestas).filter(key => {
        const respuesta = respuestas[key];
        // Para fill_in_blank, verificar que el array tenga elementos
        if (Array.isArray(respuesta)) {
          return respuesta.length > 0;
        }
        // Para otros tipos, verificar que exista
        return respuesta !== undefined && respuesta !== null;
      }).length;
      
      if (preguntasRespondidas < totalPreguntas) {
        showModal(
          'warning',
          '⚠️ Preguntas sin responder',
          `Has respondido ${preguntasRespondidas} de ${totalPreguntas} preguntas. Las preguntas sin responder se contarán como incorrectas. ¿Deseas finalizar de todos modos?`,
          () => {
            closeModal();
            // Confirmar finalización después de advertencia
            proceedWithFinalization();
          },
          true
        );
        return;
      }
    }

    proceedWithFinalization();
  };

  // Función auxiliar para proceder con la finalización
  const proceedWithFinalization = () => {
    showModal(
      'confirm',
      'Terminar Intento',
      '¿Estás seguro de que quieres terminar el intento? Una vez finalizado no podrás volver a entrar al examen.',
      async () => {
        // Prevenir múltiples ejecuciones
        if (submitting) return;
        
        try {
          setSubmitting(true);
          setModalProcessing(true); // Deshabilitar botón del modal
          const token = localStorage.getItem('token');

          // Preparar el body según el tipo de examen
          let body = {};
          if (exam.tipo === 'multiple_choice') {
            // Convertir respuestas de fill_in_blank de índices randomizados a originales
            const respuestasFinales = {};
            Object.keys(respuestas).forEach(preguntaIndex => {
              const pregunta = exam.preguntas[preguntaIndex];
              const respuesta = respuestas[preguntaIndex];
              
              if (pregunta.tipo === 'fill_in_blank' && Array.isArray(respuesta)) {
                // Convertir índices randomizados a índices originales
                respuestasFinales[preguntaIndex] = respuesta.map(randomIndex => 
                  randomizedOptions[preguntaIndex][randomIndex].originalIndex
                );
              } else {
                // Para otros tipos, mantener el índice (pero también convertir por si acaso)
                if (randomizedOptions[preguntaIndex]) {
                  respuestasFinales[preguntaIndex] = randomizedOptions[preguntaIndex][respuesta].originalIndex;
                } else {
                  respuestasFinales[preguntaIndex] = respuesta;
                }
              }
            });
            body = { respuestas: respuestasFinales };
          }

          const response = await fetch(`${API_BASE_URL}/exam-attempts/${attempt.id}/finish`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
          });

          if (response.ok) {
            // Redirigir directamente sin modal de éxito
            closeModal();
            
            if (isInSEB) {
              // Intentar cerrar SEB automáticamente
              const closed = await tryCloseSEB();
              
              // Si el usuario canceló el cierre (puso "NO"), redirigir a login
              if (!closed) {
                navigate('/login');
              }
              // Si puso "SÍ", SEB se cerrará y no llegará aquí
            } else {
              // Navegación normal si no está en SEB
              if (onBack) {
                onBack();
              } else {
                navigate('/student-exam');
              }
            }
          } else {
            const errorData = await response.json();
            const errorMessage = errorData.error || 'Error al finalizar intento';
            
            // Si el error es que el intento ya fue finalizado y estamos en SEB, redirigir a login
            if (errorMessage.includes('intento ya fue finalizado') && isInSEB) {
              showModal('error', 'Error', errorMessage, () => {
                closeModal();
                navigate('/login');
              }, false, 'Salir del examen');
            } else {
              showModal('error', 'Error', errorMessage);
            }
          }
        } catch (error) {
          console.error('Error finishing attempt:', error);
          showModal('error', 'Error', 'Error de conexión al finalizar intento');
        } finally {
          setSubmitting(false);
          setModalProcessing(false);
        }
      },
      true
    );
  };

  useEffect(() => {
    if (!examId) return;

    const loadExamAndAttempt = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Primero verificar si ya existe un intento
        const checkResponse = await fetch(`${API_BASE_URL}/exam-attempts/check/${examId}?windowId=${windowId || ''}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          
          if (checkData.hasAttempt && checkData.attempt.estado === 'finalizado') {
            setError('Ya has completado este examen');
            setLoading(false);
            return;
          }
        }

        // Cargar examen para validaciones de seguridad
        const examData = await getExamById(examId, windowId);
        setExam(examData);

        // Randomizar opciones para cada pregunta
        if (examData.preguntas) {
          const randomized = {};
          examData.preguntas.forEach((pregunta, index) => {
            if (pregunta.opciones && Array.isArray(pregunta.opciones)) {
              // Crear array con índices originales
              const opcionesConIndice = pregunta.opciones.map((texto, i) => ({
                texto,
                originalIndex: i
              }));
              // Randomizar usando Fisher-Yates shuffle
              for (let i = opcionesConIndice.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [opcionesConIndice[i], opcionesConIndice[j]] = [opcionesConIndice[j], opcionesConIndice[i]];
              }
              randomized[index] = opcionesConIndice;
            }
          });
          setRandomizedOptions(randomized);
        }

        // Redireccionar si es un examen de programación
        if (examData.tipo === 'programming') {
          const params = new URLSearchParams();
          if (windowId) params.append('windowId', windowId);
          navigate(`/programming-exam/${examId}?${params.toString()}`);
          return;
        }

        // Crear o obtener intento existente
        const attemptResponse = await fetch(`${API_BASE_URL}/exam-attempts/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            examId: parseInt(examId), 
            examWindowId: windowId ? parseInt(windowId) : null 
          })
        });

        if (attemptResponse.ok) {
          const attemptData = await attemptResponse.json();
          setAttempt(attemptData);
          
          if (attemptData.estado === 'finalizado') {
            setError('Ya has completado este examen');
            return;
          }
        } else {
          const errorData = await attemptResponse.json();
          setError(errorData.error || 'Error creando intento de examen');
        }

        setError(null);
      } catch (err) {
        console.error('Error cargando examen:', err);
        setExam(null);
        
        // Manejar errores específicos de seguridad
        if (err.code === 'WINDOW_ID_REQUIRED') {
          setError('Acceso no autorizado: Se requiere inscripción válida');
        } else if (err.code === 'NOT_ENROLLED') {
          setError('No estás inscrito en esta ventana de examen');
        } else if (err.code === 'NOT_ENABLED') {
          setError('No estás habilitado para rendir este examen');
        } else if (err.code === 'EXAM_NOT_AVAILABLE') {
          setError('El examen no está disponible en este momento');
        } else if (err.code === 'EXAM_MISMATCH') {
          setError('La ventana no corresponde a este examen');
        } else {
          setError(err.message || 'Error de acceso al examen');
        }
      } finally {
        setLoading(false);
      }
    };

    loadExamAndAttempt();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, windowId]);

  // Add page leave confirmation for exam security
  useEffect(() => {
    if (!exam || error || propExamId) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '¿Estás seguro de que quieres salir del examen? Se perderá tu progreso.';
      return e.returnValue;
    };

    const handlePopState = (e) => {
      e.preventDefault();
      showModal(
        'warning',
        'Salir del Examen',
        '¿Estás seguro de que quieres salir del examen? Se perderá todo tu progreso.',
        () => {
          closeModal();
          window.history.back();
        },
        true
      );
      
      window.history.pushState(null, '', window.location.pathname);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    window.history.pushState(null, '', window.location.pathname);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [exam, error, propExamId, closeModal, showModal]);

  if (loading) {
    return (
      <div className="container py-5">
        <div className="loading-container">
          <div className="modern-spinner"></div>
          <p>Cargando examen...</p>
        </div>
      </div>
    );
  }
  
  if (error || !exam) {
    const isExamCompleted = error && (error.includes('Ya has completado') || error.includes('intento ya fue finalizado'));
    const buttonText = isExamCompleted && isInSEB ? 'Salir del examen' : 'Volver';
    
    return (
      <div className="container py-5">
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h4 className="empty-title">Error al cargar examen</h4>
          <p className="empty-subtitle">
            {error || "El examen solicitado no existe o no tienes permisos para acceder."}
          </p>
          <button className="modern-btn modern-btn-secondary" onClick={handleErrorBack}>
            <i className={`fas ${isExamCompleted && isInSEB ? 'fa-sign-out-alt' : 'fa-arrow-left'} me-2`}></i>
            {buttonText}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="modern-card mb-4">
        <div className="modern-card-header">
          <div className="exam-attempt-header">
            <div className="header-content-section">
              <h1 className="page-title mb-0">
                <i className="fas fa-clipboard-list me-3"></i>
                <span className="title-text">{exam.titulo || "Sin título"}</span>
              </h1>
              <div className="header-badges mt-2">
                {!propExamId ? (
                  <span className="badge bg-warning text-dark">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    <span className="badge-text">EXAMEN EN CURSO</span>
                  </span>
                ) : (
                  <span className="badge bg-info text-white">
                    <i className="fas fa-eye me-1"></i>
                    <span className="badge-text">VISTA PREVIA</span>
                  </span>
                )}
                <span className="badge badge-primary">
                  <i className="fas fa-question-circle me-2"></i>
                  <span className="count-text">{exam.preguntas?.length || 0} preguntas</span>
                </span>
                {exam.tipo === 'multiple_choice' && (
                  <span className={`badge ${Object.keys(respuestas).filter(key => {
                    const respuesta = respuestas[key];
                    return Array.isArray(respuesta) ? respuesta.length > 0 : respuesta !== undefined;
                  }).length === exam.preguntas?.length ? 'bg-success' : 'bg-secondary'}`}>
                    <i className={`fas ${Object.keys(respuestas).filter(key => {
                      const respuesta = respuestas[key];
                      return Array.isArray(respuesta) ? respuesta.length > 0 : respuesta !== undefined;
                    }).length === exam.preguntas?.length ? 'fa-check-circle' : 'fa-list-check'} me-2`}></i>
                    <span className="count-text">
                      {Object.keys(respuestas).filter(key => {
                        const respuesta = respuestas[key];
                        return Array.isArray(respuesta) ? respuesta.length > 0 : respuesta !== undefined;
                      }).length} / {exam.preguntas?.length || 0} respondidas
                    </span>
                  </span>
                )}
              {isInSEB && (
                <span className="badge bg-success ms-2">
                  <i className="fas fa-lock me-1"></i>
                  Modo Seguro (SEB)
                </span>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!exam.preguntas || exam.preguntas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-question-circle"></i>
          </div>
          <h4 className="empty-title">Sin preguntas</h4>
          <p className="empty-subtitle">
            Este examen no tiene preguntas configuradas aún.
          </p>
          <button className="modern-btn modern-btn-primary" onClick={handleErrorBack}>
            <i className="fas fa-arrow-left me-2"></i>
            Volver al inicio
          </button>
        </div>
      ) : (
        <>
          <div className="exam-attempt-questions-grid">
            {exam.preguntas.map((p, i) => {
              const opcionesParaMostrar = randomizedOptions[i] || p.opciones?.map((texto, idx) => ({ texto, originalIndex: idx })) || [];
              const isFillInBlank = p.tipo === 'fill_in_blank';
              const respuestaActual = respuestas[i];
              
              return (
              <div key={i} className="exam-attempt-question-card">
                <div className={`exam-card fade-in-up`} style={{animationDelay: `${i * 0.1}s`}}>
                  <div className="exam-card-header">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge badge-primary me-2">{i + 1}</span>
                      <span 
                        className="badge"
                        style={{
                          backgroundColor: p.tipo === 'true_false' ? '#28a745' : p.tipo === 'fill_in_blank' ? '#ffc107' : '#007bff',
                          color: 'white',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          borderRadius: '6px'
                        }}
                      >
                        <i className={`fas ${p.tipo === 'true_false' ? 'fa-check-double' : p.tipo === 'fill_in_blank' ? 'fa-fill-drip' : 'fa-list-ul'} me-1`}></i>
                        {p.tipo === 'true_false' ? 'V/F' : p.tipo === 'fill_in_blank' ? 'Completar' : 'Múltiple'}
                      </span>
                    </div>
                    <h5 className="exam-title mt-2">
                      <span className="question-text">{p.texto || "Sin texto"}</span>
                    </h5>
                  </div>
                  <div className="exam-card-body">
                    <div className="exam-info">
                      <h6 className="mb-3">
                        <i className={`fas ${isFillInBlank ? 'fa-check-double' : 'fa-list-ul'} me-2`}></i>
                        <span className="options-label">{isFillInBlank ? 'Selecciona las respuestas (en orden):' : 'Selecciona tu respuesta:'}</span>
                      </h6>
                      {isFillInBlank && (
                        <div className="alert alert-info mb-3" style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}>
                          <i className="fas fa-info-circle me-2"></i>
                          Selecciona las opciones en el orden en que deben aparecer en los espacios en blanco
                        </div>
                      )}
                      <div className="exam-options-list">
                        {opcionesParaMostrar.map((opcion, j) => {
                          const isSelected = isFillInBlank 
                            ? Array.isArray(respuestaActual) && respuestaActual.includes(j)
                            : respuestaActual === j;
                          const selectionOrder = isFillInBlank && Array.isArray(respuestaActual) 
                            ? respuestaActual.indexOf(j) + 1 
                            : null;
                          
                          return (
                          <div 
                            key={j} 
                            className={`exam-option-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              if (isFillInBlank) {
                                setRespuestas(prev => {
                                  const current = Array.isArray(prev[i]) ? prev[i] : [];
                                  if (current.includes(j)) {
                                    // Deseleccionar
                                    return {
                                      ...prev,
                                      [i]: current.filter(idx => idx !== j)
                                    };
                                  } else {
                                    // Seleccionar (agregar al final)
                                    return {
                                      ...prev,
                                      [i]: [...current, j]
                                    };
                                  }
                                });
                              } else {
                                setRespuestas(prev => ({
                                  ...prev,
                                  [i]: j
                                }));
                              }
                            }}
                            style={{
                              padding: '0.75rem 1rem',
                              marginBottom: '0.5rem',
                              border: isSelected ? '2px solid #0d6efd' : '1px solid #dee2e6',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? '#e7f1ff' : 'white',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                                e.currentTarget.style.borderColor = '#adb5bd';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = 'white';
                                e.currentTarget.style.borderColor = '#dee2e6';
                              }
                            }}
                          >
                            {isFillInBlank ? (
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                border: isSelected ? '2px solid #0d6efd' : '2px solid #adb5bd',
                                backgroundColor: isSelected ? '#0d6efd' : 'white',
                                flexShrink: 0,
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                color: 'white',
                                fontSize: '0.75rem'
                              }}>
                                {isSelected && selectionOrder}
                              </div>
                            ) : (
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                border: isSelected ? '6px solid #0d6efd' : '2px solid #adb5bd',
                                flexShrink: 0,
                                transition: 'all 0.2s ease'
                              }}></div>
                            )}
                            <span style={{
                              fontSize: '0.95rem',
                              color: isSelected ? '#0d6efd' : '#212529',
                              fontWeight: isSelected ? '500' : '400'
                            }}>
                              {opcion.texto || "Opción vacía"}
                            </span>
                          </div>
                        );})}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );})}
          </div>

          {/* Botón Terminar intento */}
          <div className="modern-card mt-4">
            <div className="modern-card-body text-center">
              <div className="exam-completion-section">
                <h5 className="completion-title mb-3">
                  <i className="fas fa-flag-checkered me-2"></i>
                  <span className="completion-text">¿Terminaste el examen?</span>
                </h5>
                <p className="completion-description text-muted mb-4">
                  Una vez que finalices el intento, no podrás volver a entrar al examen. Asegúrate de haber respondido todas las preguntas.
                </p>
                <div className="exam-attempt-actions">
                  <button 
                    className="modern-btn modern-btn-primary modern-btn-lg" 
                    onClick={handleExamCompletion}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                        <span className="btn-text">Finalizando...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check me-2"></i>
                        <span className="btn-text">Finalizar Intento</span>
                      </>
                    )}
                  </button>
                  {propExamId && (
                    <button className="modern-btn modern-btn-secondary modern-btn-lg" onClick={handleExamCompletion}>
                      <i className="fas fa-arrow-left me-2"></i>
                      <span className="btn-text">Volver al inicio</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Component */}
      <Modal
        show={modal.show}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        showCancel={modal.showCancel}
        confirmText={modal.confirmText || (modal.type === 'warning' ? 'Salir del Examen' : modal.type === 'confirm' ? 'Finalizar' : 'Aceptar')}
        cancelText={modal.type === 'confirm' ? 'Cancelar' : 'Continuar Examen'}
        isProcessing={modal.isProcessing}
      />
    </div>
  );
};

export default ExamAttempt;
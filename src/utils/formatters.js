import {
  PayStatusPending, PayStatusCompleted, PayStatusCanceled, PayStatusProcessing,
  PayMethodMercadoPago, PayMethodBrubank, PayMethodBankTransfer,
  PayMethodCash, PayMethodDebit, MonthsMap,
} from "../constants/payments";
import { AdminRole, CoachRole, StatusDeleted } from "../constants/users";
import {
  PlanStatusActive, PlanStatusFinish, PlanStatusCanceled,
  ExerciseArms, ExerciseBack, ExerciseLegs, ExerciseChest, ExerciseAbs,
} from "../constants/trainingPlans";

export const formatDate = (isoString, fallback = "Sin fecha") => {
  if (!isoString) return fallback;
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(date);
};

export const formatRole = (role) => {
  if (role === AdminRole) return "Administrador";
  if (role === CoachRole) return "Entrenador";
  return "Cliente";
};

export const formatUserStatus = (status, inactiveLabel = "Inactivo") => {
  if (status === StatusDeleted) return inactiveLabel;
  return "Activo";
};

export const formatPlanStatus = (status) => {
  if (status === PlanStatusActive) return "Activo";
  if (status === PlanStatusFinish) return "Finalizado";
  if (status === PlanStatusCanceled) return "Cancelado";
  return status;
};

export const formatPaymentStatus = (status) => {
  const map = {
    [PayStatusPending]: "Pendiente",
    [PayStatusCompleted]: "Pagada",
    [PayStatusCanceled]: "Cancelada",
    [PayStatusProcessing]: "Procesando",
  };
  return map[status] || "Error";
};

export const formatPaymentMethod = (method) => {
  const map = {
    [PayMethodMercadoPago]: "Mercado Pago",
    [PayMethodBrubank]: "Brubank",
    [PayMethodBankTransfer]: "Transferencia",
    [PayMethodCash]: "Efectivo",
    [PayMethodDebit]: "Debito",
  };
  return map[method] || "Sin forma de pago";
};

export const formatExerciseType = (type) => {
  const map = {
    [ExerciseArms]: "Brazos",
    [ExerciseBack]: "Espalda",
    [ExerciseLegs]: "Piernas",
    [ExerciseChest]: "Pecho",
    [ExerciseAbs]: "Abdominales",
  };
  return map[type] || "Grupo desconocido";
};

export const getFinalAmount = (payment) => {
  const total = parseFloat(payment.total_amount) || 0;
  const penalties = parseFloat(payment.penalties_sum) || 0;
  const discounts = parseFloat(payment.discounts_sum) || 0;
  return (total + penalties - discounts).toFixed(2);
};

export const getMonth = (dateString) => {
  const date = new Date(dateString);
  return MonthsMap[date.getUTCMonth() + 1];
};

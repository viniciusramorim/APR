const OFFLINE_APRS_KEY = "offline_aprs";
const OFFLINE_EDIT_KEY = "edit_offline_apr";

const parseStoredJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error("Erro ao ler dados offline:", error);
    return fallback;
  }
};

const fileToSerializable = (file) =>
  new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result,
      });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const serializableToFile = async (image) => {
  if (!image || image instanceof File) {
    return image;
  }

  if (!image.data || !image.name) {
    return image;
  }

  const response = await fetch(image.data);
  const blob = await response.blob();
  return new File([blob], image.name, {
    type: image.type || blob.type || "image/jpeg",
  });
};

export const getOfflineAprs = () =>
  parseStoredJson(localStorage.getItem(OFFLINE_APRS_KEY), []);

export const getUserOfflineAprs = (userId) => {
  const aprs = getOfflineAprs();

  if (!userId) {
    return aprs;
  }

  return aprs.filter((apr) => apr.user?.uid === userId);
};

export const getOfflineAprById = (aprId) =>
  getOfflineAprs().find((apr) => apr.id === aprId) || null;

export const saveOfflineAprRecord = (aprData) => {
  const existingData = getOfflineAprs();
  existingData.push(aprData);
  localStorage.setItem(OFFLINE_APRS_KEY, JSON.stringify(existingData));
  return aprData;
};

export const updateOfflineAprRecord = (aprId, nextData) => {
  const existingData = getOfflineAprs();
  const aprIndex = existingData.findIndex((apr) => apr.id === aprId);

  if (aprIndex === -1) {
    return null;
  }

  existingData[aprIndex] = {
    ...existingData[aprIndex],
    ...nextData,
  };

  localStorage.setItem(OFFLINE_APRS_KEY, JSON.stringify(existingData));
  return existingData[aprIndex];
};

export const removeOfflineAprRecord = (aprId) => {
  const updatedData = getOfflineAprs().filter((apr) => apr.id !== aprId);
  localStorage.setItem(OFFLINE_APRS_KEY, JSON.stringify(updatedData));
  return updatedData;
};

export const clearOfflineAprs = () => {
  localStorage.removeItem(OFFLINE_APRS_KEY);
};

export const setOfflineAprEditSession = (aprData) => {
  sessionStorage.setItem(OFFLINE_EDIT_KEY, JSON.stringify(aprData));
};

export const getOfflineAprEditSession = () =>
  parseStoredJson(sessionStorage.getItem(OFFLINE_EDIT_KEY), null);

export const clearOfflineAprEditSession = () => {
  sessionStorage.removeItem(OFFLINE_EDIT_KEY);
};

export const buildOfflineAprEditUrl = (aprData, options = {}) => {
  const { autoSync = false } = options;
  const route = aprData.idAssign
    ? `/new/${aprData.siteId}/${aprData.idAssign}`
    : `/new/${aprData.siteId}`;

  const params = new URLSearchParams({ edit_offline: aprData.id });
  if (autoSync) {
    params.set("auto_sync", "1");
  }

  return `${route}?${params.toString()}`;
};

export const serializeQuestionsForOffline = async (questions) => {
  const serializedQuestions = [];

  for (const area of questions) {
    if (!Array.isArray(area) || area.length < 2) {
      serializedQuestions.push(area);
      continue;
    }

    const [areaName, areaQuestions] = area;
    const serializedAreaQuestions = [];

    for (const question of areaQuestions) {
      const nextQuestion = { ...question };

      if (Array.isArray(question.images) && question.images.length > 0) {
        nextQuestion.images = await Promise.all(
          question.images.map((image) => fileToSerializable(image))
        );
      }

      serializedAreaQuestions.push(nextQuestion);
    }

    serializedQuestions.push([areaName, serializedAreaQuestions]);
  }

  return serializedQuestions;
};

export const hydrateQuestionsFromOffline = async (questions) => {
  const hydratedQuestions = [];

  for (const area of questions || []) {
    if (!Array.isArray(area) || area.length < 2) {
      hydratedQuestions.push(area);
      continue;
    }

    const [areaName, areaQuestions] = area;
    const hydratedAreaQuestions = [];

    for (const question of areaQuestions) {
      const nextQuestion = { ...question };

      if (Array.isArray(question.images) && question.images.length > 0) {
        nextQuestion.images = await Promise.all(
          question.images.map((image) => serializableToFile(image))
        );
      } else {
        nextQuestion.images = [];
      }

      hydratedAreaQuestions.push(nextQuestion);
    }

    hydratedQuestions.push([areaName, hydratedAreaQuestions]);
  }

  return hydratedQuestions;
};

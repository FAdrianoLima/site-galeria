// Firestore Mock – mantém tudo em memória
const mockDB = {
  cargas: []
};

export const mockCollection = (name) => ({
  name
});

export const mockAddDoc = async (ref, data) => {
  const id = String(Date.now()) + Math.random().toString(16).slice(2);
  mockDB[ref.name].push({ id, ...data });
  return { id };
};

export const mockGetDocs = async (ref) => {
  return {
    docs: mockDB[ref.name].map((item) => ({
      id: item.id,
      data: () => item
    }))
  };
};

export const mockGetDoc = async (ref) => {
  const item = mockDB[ref.collection][ref.id];
};

export const mockUpdateDoc = async () => {
  return true;
};

export const mockDeleteDoc = async () => {
  return true;
};

export const mockDoc = (db, name, id) => ({
  collection: name,
  id
});

export const mockQuery = () => ({});
export const mockWhere = () => ({});

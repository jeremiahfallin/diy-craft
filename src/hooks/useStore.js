import { create } from "zustand";
import ShortUniqueId from "short-unique-id";

const { randomUUID } = new ShortUniqueId({ length: 10 });

const useStore = create((set, get) => ({
  combinations: {},
  elements: [
    { text: "Water", discovered: false },
    { text: "Fire", discovered: false },
    { text: "Wind", discovered: false },
    { text: "Earth", discovered: false },
  ],
  boardElements: [],
  resetElements: () =>
    set(() => ({
      elements: [
        { text: "Water", discovered: false },
        { text: "Fire", discovered: false },
        { text: "Wind", discovered: false },
        { text: "Earth", discovered: false },
      ],
    })),
  addElement: (text) =>
    set((state) => ({
      elements: [...state.elements, { text, discovered: false }],
    })),
  addToBoard: (text, uid) =>
    set((state) => ({
      boardElements: [...state.boardElements, { text, uid: randomUUID() }],
    })),
  removeFromBoard: (uid) =>
    set((state) => ({
      boardElements: state.boardElements.filter(
        (element) => element.uid !== uid
      ),
    })),
  addCombination: (combination, result) => {
    const { elements } = get();
    if (!elements.find((element) => element.text === result)) {
      set((state) => ({
        elements: [...state.elements, { text: result, discovered: false }],
      }));
    }
    set((state) => ({
      combinations: { ...state.combinations, [combination]: result },
    }));
  },
}));

export default useStore;

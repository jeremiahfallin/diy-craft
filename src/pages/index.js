import { useState } from "react";
import Head from "next/head";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { createSnapModifier } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Flex,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from "@chakra-ui/react";

import useStore from "@/hooks/useStore";

const gridSize = 20; // pixels
const snapToGridModifier = createSnapModifier(gridSize);

function Draggable(props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id,
  });

  const combinedStyle = {
    transform: CSS.Translate.toString(transform),
    ...props.style, // Accept external styles
  };

  return (
    <div
      ref={setNodeRef}
      style={{ border: "1px solid black", ...combinedStyle }}
      {...listeners}
      {...attributes}
    >
      {props.children}
    </div>
  );
}

function Droppable({ id, children }) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return <div ref={setNodeRef}>{children}</div>;
}

function Sidebar() {
  const elements = useStore((state) => state.elements);
  const addToBoard = useStore((state) => state.addToBoard);
  const { setNodeRef } = useDroppable({
    id: "sideboard",
  });

  return (
    <Box id="sideboard" w="200px" h="100%" ref={setNodeRef}>
      <Heading as="h2" size="lg">
        Elements
      </Heading>
      <Flex flexDir="column" gap="1rem">
        {elements.map((element) => (
          <Flex
            key={element.text}
            justify={"space-between"}
            gap="1rem"
            align="center"
            border="1px solid"
            borderColor={"whiteAlpha.900"}
            padding="0.5rem"
            borderRadius="0.5rem"
          >
            {element.text}
            <Button onClick={() => addToBoard(element.text)}>Add</Button>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}

function Board({ positions, setPositions }) {
  const boardElements = useStore((state) => state.boardElements);
  const { setNodeRef } = useDroppable({
    id: "board",
  });

  const doesOverlap = (newPos, existingPositions) => {
    return Object.values(existingPositions).some((pos) => {
      return (
        Math.abs(pos.x - newPos.x) < 100 && Math.abs(pos.y - newPos.y) < 100
      ); // Assuming each element is less than 100x100px
    });
  };

  return (
    <Flex
      id="board"
      gap="1rem"
      w="100%"
      flex={1}
      flexWrap="wrap"
      ref={setNodeRef}
    >
      {boardElements.map((element) => {
        if (!positions[element.uid]) {
          let newPos = { x: 0, y: 0 };
          while (doesOverlap(newPos, positions)) {
            newPos.x += 100; // Move right for the next position
            if (newPos.x >= window.innerWidth - 100) {
              // Assuming board width is window's width, adjust as needed
              newPos.x = 0;
              newPos.y += 100; // Move down if we reach the end of the row
            }
          }
          // Update positions state with new position
          setPositions((prev) => ({ ...prev, [element.uid]: newPos }));
        }

        return (
          <Box
            key={element.uid}
            style={{
              position: "absolute",
              left: `${positions[element.uid]?.x}px` || 0,
              top: `${positions[element.uid]?.y}px` || 0,
            }}
          >
            <Droppable id={element.uid}>
              <Draggable id={element.uid}>
                <Card direction={"row"}>
                  <CardBody>
                    <Text>{element.text}</Text>
                  </CardBody>
                </Card>
              </Draggable>
            </Droppable>
          </Box>
        );
      })}
    </Flex>
  );
}

function CombinationModal({ isOpen, onClose, combination }) {
  const [result, setResult] = useState("");
  const addCombination = useStore((state) => state.addCombination);
  const addToBoard = useStore((state) => state.addToBoard);

  function handleSave() {
    addCombination(combination, result);
    addToBoard(result, result);
    onClose();
    setResult("");
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalCloseButton />
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Combination</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {combination} =
          <Input
            placeholder="Result"
            value={result}
            onChange={(e) => setResult(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSave}>
            Save
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function Home() {
  const [combo, setCombo] = useState("");
  const [positions, setPositions] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const elements = useStore((state) => state.boardElements);
  const combinations = useStore((state) => state.combinations);
  const addToBoard = useStore((state) => state.addToBoard);
  const removeFromBoard = useStore((state) => state.removeFromBoard);

  const handleDragEnd = (event) => {
    const { active, over, delta } = event;

    if (over.id === "board") {
      setPositions((prevPositions) => {
        const newPos = prevPositions[active.id]
          ? {
              x: prevPositions[active.id].x + delta.x,
              y: prevPositions[active.id].y + delta.y,
            }
          : { x: delta.x, y: delta.y };

        return { ...prevPositions, [active.id]: newPos };
      });
    } else if (over.id === "sideboard") {
      removeFromBoard(active.id);
    } else if (over && active.id !== over.id) {
      const activeElement = elements.find(
        (element) => element.uid === active.id
      );
      const overElement = elements.find((element) => element.uid === over.id);
      const [first, second] = [activeElement.text, overElement.text].sort();
      const combination = `${first}+${second}`;
      const result = combinations[combination];

      if (result) {
        addToBoard(result, result);
        removeFromBoard(active.id);
        removeFromBoard(over.id);
      } else {
        setCombo(combination);
        onOpen();
        removeFromBoard(active.id);
        removeFromBoard(over.id);
      }
    }
  };

  return (
    <>
      <Head>
        <title>Infinite Merge</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Flex as="main" h="100%" justify="space-between" gap="1rem">
        <CombinationModal
          isOpen={isOpen}
          onClose={onClose}
          combination={combo}
        />
        <DndContext onDragEnd={handleDragEnd} modifiers={[snapToGridModifier]}>
          <Board positions={positions} setPositions={setPositions} />
          <Divider backgroundColor={"white"} orientation={"vertical"} />
          <Sidebar />
        </DndContext>
      </Flex>
    </>
  );
}

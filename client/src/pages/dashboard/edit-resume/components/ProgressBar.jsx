import React from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";

const DEFAULT_STEPS = [
  "Personal Detail",
  "Summary",
  "Experience",
  "Projects",
  "Education",
  "Skills",
];

function ProgressBar({
  currentStep = 1,
  onStepClick,
  sectionOrder = DEFAULT_STEPS,
  setSectionOrder,
  onDragEnd,
}) {
  const steps = sectionOrder.length ? sectionOrder : DEFAULT_STEPS;
  const activeStep = Math.min(Math.max(currentStep, 1), steps.length);
  const fixedStep = steps[0] || DEFAULT_STEPS[0];
  const draggableSteps = steps.slice(1);

  const fallbackHandleDragEnd = (result) => {
    const { source, destination } = result || {};

    if (!destination) return;
    if (source.index === destination.index) return;

    setSectionOrder?.((prev) => {
      if (!Array.isArray(prev) || prev.length <= 1) return prev;

      const fixed = prev[0];
      const reorderable = [...prev.slice(1)];
      const [moved] = reorderable.splice(source.index, 1);
      reorderable.splice(destination.index, 0, moved);

      return [fixed, ...reorderable];
    });
  };

  const renderStep = (label, index, dragHandleProps = {}) => {
    const stepNumber = index + 1;
    const isCompletedOrCurrent = stepNumber <= activeStep;
    const isConnectingLineActive = activeStep >= stepNumber + 1;
    const isFixed = index === 0;

    return (
      <div className="relative flex min-w-[110px] flex-1 items-start justify-center">
        <div className="flex min-w-[76px] flex-col items-center text-center">
          <button
            type="button"
            onClick={() => onStepClick?.(stepNumber)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
              isCompletedOrCurrent
                ? "border-indigo-600 bg-indigo-100 text-indigo-700"
                : "border-gray-300 bg-gray-100 text-gray-500"
            } ${onStepClick ? "cursor-pointer hover:border-indigo-500 hover:text-indigo-700" : "cursor-default"} ${
              !isFixed && dragHandleProps?.onMouseDown ? "active:cursor-grabbing" : ""
            }`}
            aria-label={`Go to ${label}`}
            disabled={!onStepClick}
            {...dragHandleProps}
          >
            {stepNumber}
          </button>
          <p
            className={`mt-2 text-xs leading-4 sm:text-sm ${
              isCompletedOrCurrent ? "text-indigo-700" : "text-gray-500"
            }`}
          >
            {label}
          </p>
        </div>

        {index < steps.length - 1 && (
          <div className="pointer-events-none absolute left-[calc(50%+22px)] right-[-50%] top-4">
            <div
              className={`h-0.5 rounded ${
                isConnectingLineActive ? "bg-indigo-600" : "bg-gray-300"
              }`}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <DragDropContext onDragEnd={onDragEnd || fallbackHandleDragEnd}>
        <div className="flex items-start">
          <div className="flex min-w-[110px] flex-1 items-start justify-center">
            {renderStep(fixedStep, 0)}
          </div>

          <Droppable droppableId="progress-steps" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-1 items-start"
              >
                {draggableSteps.map((label, reorderableIndex) => {
                  const actualIndex = reorderableIndex + 1;

                  return (
                    <Draggable
                      key={label}
                      draggableId={label}
                      index={reorderableIndex}
                    >
                      {(draggableProvided, snapshot) => (
                        <div
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          {...draggableProvided.dragHandleProps}
                          style={draggableProvided.draggableProps.style}
                          className={`flex min-w-[110px] flex-1 items-start justify-center ${
                            snapshot.isDragging ? "z-20 cursor-grabbing" : "cursor-grab"
                          }`}
                        >
                          {renderStep(label, actualIndex)}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
}

export default ProgressBar;
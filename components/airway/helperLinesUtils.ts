import type { GraphNode, NodePositionChange, NodeDimensionChange, XYPosition } from '@vue-flow/core'

interface GetHelperLinesResult {
  horizontal?: number
  vertical?: number
  snapPosition: Partial<XYPosition>
  horizontalDistance?: number // Расстояние между узлами по горизонтали
  verticalDistance?: number   // Расстояние между узлами по вертикали
}

// Эта функция вычисляет позиции вспомогательных линий и позицию для прилипания узла при перемещении
export function getHelperLines(change: NodePositionChange, nodes: GraphNode[], distance = 5): GetHelperLinesResult {
  const defaultResult = {
    horizontal: undefined,
    vertical: undefined,
    snapPosition: { x: undefined, y: undefined },
  }

  const nodeA = nodes.find((node) => node.id === change.id)

  if (!nodeA || !change.position) {
    return defaultResult
  }

  // Получаем размеры узла из dimensions или из DOM
  const nodeAWidth = (nodeA.dimensions?.width as number) ?? (nodeA.measured?.width as number) ?? (nodeA.width as number) ?? 200
  const nodeAHeight = (nodeA.dimensions?.height as number) ?? (nodeA.measured?.height as number) ?? (nodeA.height as number) ?? 100
  
  const nodeABounds = {
    left: change.position.x,
    right: change.position.x + nodeAWidth,
    top: change.position.y,
    bottom: change.position.y + nodeAHeight,
    width: nodeAWidth,
    height: nodeAHeight,
  }

  let horizontalDistance = distance
  let verticalDistance = distance
  
  // Находим ближайшие узлы для показа расстояний между краями
  let closestNodeBelow: { node: GraphNode, distance: number } | null = null // Узел ниже A
  let closestNodeAbove: { node: GraphNode, distance: number } | null = null // Узел выше A
  let closestNodeRight: { node: GraphNode, distance: number } | null = null // Узел справа от A
  let closestNodeLeft: { node: GraphNode, distance: number } | null = null // Узел слева от A

  // Сначала проходим по всем узлам, чтобы найти ближайшие
  nodes
    .filter((node) => node.id !== nodeA.id)
    .forEach((nodeB) => {
      const nodeBWidth = (nodeB.dimensions?.width as number) ?? (nodeB.measured?.width as number) ?? (nodeB.width as number) ?? 200
      const nodeBHeight = (nodeB.dimensions?.height as number) ?? (nodeB.measured?.height as number) ?? (nodeB.height as number) ?? 100
      
      const nodeBBounds = {
        left: nodeB.position.x,
        right: nodeB.position.x + nodeBWidth,
        top: nodeB.position.y,
        bottom: nodeB.position.y + nodeBHeight,
      }

      // Проверяем перекрытие или близость по перпендикулярной оси
      const overlapX = !(nodeBBounds.right <= nodeABounds.left || nodeBBounds.left >= nodeABounds.right)
      const overlapY = !(nodeBBounds.bottom <= nodeABounds.top || nodeBBounds.top >= nodeABounds.bottom)
      
      // Узел ниже A (нижний край A до верхнего края B) - проверяем перекрытие по X
      if (nodeBBounds.top >= nodeABounds.bottom && overlapX) {
        const dist = nodeBBounds.top - nodeABounds.bottom
        if (!closestNodeBelow || dist < closestNodeBelow.distance) {
          closestNodeBelow = { node: nodeB, distance: dist }
        }
      }
      // Узел выше A (нижний край B до верхнего края A) - проверяем перекрытие по X
      if (nodeBBounds.bottom <= nodeABounds.top && overlapX) {
        const dist = nodeABounds.top - nodeBBounds.bottom
        if (!closestNodeAbove || dist < closestNodeAbove.distance) {
          closestNodeAbove = { node: nodeB, distance: dist }
        }
      }
      // Узел справа от A (правый край A до левого края B) - проверяем перекрытие по Y
      if (nodeBBounds.left >= nodeABounds.right && overlapY) {
        const dist = nodeBBounds.left - nodeABounds.right
        if (!closestNodeRight || dist < closestNodeRight.distance) {
          closestNodeRight = { node: nodeB, distance: dist }
        }
      }
      // Узел слева от A (правый край B до левого края A) - проверяем перекрытие по Y
      if (nodeBBounds.right <= nodeABounds.left && overlapY) {
        const dist = nodeABounds.left - nodeBBounds.right
        if (!closestNodeLeft || dist < closestNodeLeft.distance) {
          closestNodeLeft = { node: nodeB, distance: dist }
        }
      }
    })

  const result = nodes
    .filter((node) => node.id !== nodeA.id)
    .reduce<GetHelperLinesResult>((result, nodeB) => {
      // Получаем размеры узла из dimensions или из DOM
      const nodeBWidth = (nodeB.dimensions?.width as number) ?? (nodeB.measured?.width as number) ?? (nodeB.width as number) ?? 200
      const nodeBHeight = (nodeB.dimensions?.height as number) ?? (nodeB.measured?.height as number) ?? (nodeB.height as number) ?? 100
      
      const nodeBBounds = {
        left: nodeB.position.x,
        right: nodeB.position.x + nodeBWidth,
        top: nodeB.position.y,
        bottom: nodeB.position.y + nodeBHeight,
        width: nodeBWidth,
        height: nodeBHeight,
      }

      // Выравнивание левого края с левым краем
      const distanceLeftLeft = Math.abs(nodeABounds.left - nodeBBounds.left)
      if (distanceLeftLeft < verticalDistance) {
        result.snapPosition.x = nodeBBounds.left
        result.vertical = nodeBBounds.left
        result.verticalDistance = 0 // Края совпадают
        verticalDistance = distanceLeftLeft
      }

      // Выравнивание правого края с правым краем
      const distanceRightRight = Math.abs(nodeABounds.right - nodeBBounds.right)
      if (distanceRightRight < verticalDistance) {
        result.snapPosition.x = nodeBBounds.right - nodeABounds.width
        result.vertical = nodeBBounds.right
        result.verticalDistance = 0 // Края совпадают
        verticalDistance = distanceRightRight
      }

      // Выравнивание левого края A с правым краем B (A справа от B)
      if (nodeABounds.left >= nodeBBounds.right) {
        const distanceLeftRight = nodeABounds.left - nodeBBounds.right
        if (distanceLeftRight >= 0 && distanceLeftRight <= 50 && distanceLeftRight < verticalDistance) {
          result.snapPosition.x = nodeBBounds.right
          result.vertical = nodeBBounds.right
          result.verticalDistance = distanceLeftRight // Расстояние от правого края B до левого края A
          verticalDistance = distanceLeftRight
        }
      }

      // Выравнивание правого края A с левым краем B (A слева от B)
      if (nodeABounds.right <= nodeBBounds.left) {
        const distanceRightLeft = nodeBBounds.left - nodeABounds.right
        if (distanceRightLeft >= 0 && distanceRightLeft <= 50 && distanceRightLeft < verticalDistance) {
          result.snapPosition.x = nodeBBounds.left - nodeABounds.width
          result.vertical = nodeBBounds.left
          result.verticalDistance = distanceRightLeft // Расстояние от правого края A до левого края B
          verticalDistance = distanceRightLeft
        }
      }

      // Выравнивание верхнего края с верхним краем
      const distanceTopTop = Math.abs(nodeABounds.top - nodeBBounds.top)
      if (distanceTopTop < horizontalDistance) {
        result.snapPosition.y = nodeBBounds.top
        result.horizontal = nodeBBounds.top
        result.horizontalDistance = 0 // Края совпадают
        horizontalDistance = distanceTopTop
      }

      // Выравнивание нижнего края A с верхним краем B (A выше B)
      if (nodeABounds.bottom <= nodeBBounds.top) {
        const distanceBottomTop = nodeBBounds.top - nodeABounds.bottom
        if (distanceBottomTop >= 0 && distanceBottomTop <= 50 && distanceBottomTop < horizontalDistance) {
          result.snapPosition.y = nodeBBounds.top - nodeABounds.height
          result.horizontal = nodeBBounds.top
          result.horizontalDistance = distanceBottomTop // Расстояние от нижнего края A до верхнего края B
          horizontalDistance = distanceBottomTop
        }
      }

      // Выравнивание нижнего края с нижним краем
      const distanceBottomBottom = Math.abs(nodeABounds.bottom - nodeBBounds.bottom)
      if (distanceBottomBottom < horizontalDistance) {
        result.snapPosition.y = nodeBBounds.bottom - nodeABounds.height
        result.horizontal = nodeBBounds.bottom
        result.horizontalDistance = 0 // Края совпадают
        horizontalDistance = distanceBottomBottom
      }

      // Выравнивание верхнего края A с нижним краем B (A ниже B)
      if (nodeABounds.top >= nodeBBounds.bottom) {
        const distanceTopBottom = nodeABounds.top - nodeBBounds.bottom
        if (distanceTopBottom >= 0 && distanceTopBottom <= 50 && distanceTopBottom < horizontalDistance) {
          result.snapPosition.y = nodeBBounds.bottom
          result.horizontal = nodeBBounds.bottom
          result.horizontalDistance = distanceTopBottom // Расстояние от нижнего края B до верхнего края A
          horizontalDistance = distanceTopBottom
        }
      }

      // Выравнивание по центру по горизонтали (центр A с центром B)
      const nodeACenterY = nodeABounds.top + nodeABounds.height / 2
      const nodeBCenterY = nodeBBounds.top + nodeBBounds.height / 2
      const distanceCenterY = Math.abs(nodeACenterY - nodeBCenterY)
      if (distanceCenterY < horizontalDistance) {
        result.snapPosition.y = nodeBCenterY - nodeABounds.height / 2
        result.horizontal = nodeBCenterY
        horizontalDistance = distanceCenterY
      }

      // Выравнивание по центру по вертикали (центр A с центром B)
      const nodeACenterX = nodeABounds.left + nodeABounds.width / 2
      const nodeBCenterX = nodeBBounds.left + nodeBBounds.width / 2
      const distanceCenterX = Math.abs(nodeACenterX - nodeBCenterX)
      if (distanceCenterX < verticalDistance) {
        result.snapPosition.x = nodeBCenterX - nodeABounds.width / 2
        result.vertical = nodeBCenterX
        verticalDistance = distanceCenterX
      }

      return result
    }, { ...defaultResult, horizontalDistance: undefined, verticalDistance: undefined })
  
  // Устанавливаем расстояния от ближайших узлов, если они не были установлены при выравнивании
  // Расстояние по вертикали: от нижнего края верхнего узла до верхнего края нижнего узла
  // Показываем только если расстояние >= 0px и <= 50px
  if (result.horizontal === undefined || result.horizontalDistance === undefined) {
    if (closestNodeBelow && closestNodeBelow.distance >= 0 && closestNodeBelow.distance <= 50) {
      // Если нет горизонтальной линии, создаем её на уровне верхнего края нижнего узла
      const nodeB = closestNodeBelow.node
      result.horizontal = nodeB.position.y
      result.horizontalDistance = closestNodeBelow.distance
    } else if (closestNodeAbove && closestNodeAbove.distance >= 0 && closestNodeAbove.distance <= 50) {
      // Если нет горизонтальной линии, создаем её на уровне нижнего края верхнего узла
      const nodeB = closestNodeAbove.node
      const nodeBHeight = (nodeB.dimensions?.height as number) ?? (nodeB.measured?.height as number) ?? (nodeB.height as number) ?? 100
      result.horizontal = nodeB.position.y + nodeBHeight
      result.horizontalDistance = closestNodeAbove.distance
    }
  }
  
  // Расстояние по горизонтали: от правого края левого узла до левого края правого узла
  // Показываем только если расстояние >= 0px и <= 50px
  if (result.vertical === undefined || result.verticalDistance === undefined) {
    if (closestNodeRight && closestNodeRight.distance >= 0 && closestNodeRight.distance <= 50) {
      // Если нет вертикальной линии, создаем её на уровне левого края правого узла
      result.vertical = closestNodeRight.node.position.x
      result.verticalDistance = closestNodeRight.distance
    } else if (closestNodeLeft && closestNodeLeft.distance >= 0 && closestNodeLeft.distance <= 50) {
      // Если нет вертикальной линии, создаем её на уровне правого края левого узла
      const nodeB = closestNodeLeft.node
      const nodeBWidth = (nodeB.dimensions?.width as number) ?? (nodeB.measured?.width as number) ?? (nodeB.width as number) ?? 200
      result.vertical = nodeB.position.x + nodeBWidth
      result.verticalDistance = closestNodeLeft.distance
    }
  }
  
  return result
}

// Функция для вычисления вспомогательных линий при изменении размера узла
export function getHelperLinesForResize(
  change: NodeDimensionChange, 
  nodes: GraphNode[], 
  distance = 5
): GetHelperLinesResult {
  const defaultResult: GetHelperLinesResult = {
    horizontal: undefined,
    vertical: undefined,
    snapPosition: { x: undefined, y: undefined },
    horizontalDistance: undefined,
    verticalDistance: undefined,
  }

  const nodeA = nodes.find((node) => node.id === change.id)

  if (!nodeA || !change.dimensions) {
    return defaultResult
  }

  // Используем новые размеры из change
  const nodeAWidth = change.dimensions.width
  const nodeAHeight = change.dimensions.height
  
  const nodeABounds = {
    left: nodeA.position.x,
    right: nodeA.position.x + nodeAWidth,
    top: nodeA.position.y,
    bottom: nodeA.position.y + nodeAHeight,
    width: nodeAWidth,
    height: nodeAHeight,
  }

  let horizontalDistance = distance
  let verticalDistance = distance

  return nodes
    .filter((node) => node.id !== nodeA.id)
    .reduce<GetHelperLinesResult>((result, nodeB) => {
      const nodeBWidth = (nodeB.dimensions?.width as number) ?? (nodeB.measured?.width as number) ?? (nodeB.width as number) ?? 200
      const nodeBHeight = (nodeB.dimensions?.height as number) ?? (nodeB.measured?.height as number) ?? (nodeB.height as number) ?? 100
      
      const nodeBBounds = {
        left: nodeB.position.x,
        right: nodeB.position.x + nodeBWidth,
        top: nodeB.position.y,
        bottom: nodeB.position.y + nodeBHeight,
        width: nodeBWidth,
        height: nodeBHeight,
      }

      // Выравнивание по краям и центрам - аналогично getHelperLines
      // Выравнивание левого края
      const distanceLeftLeft = Math.abs(nodeABounds.left - nodeBBounds.left)
      if (distanceLeftLeft < verticalDistance) {
        result.snapPosition.x = nodeBBounds.left
        result.vertical = nodeBBounds.left
        verticalDistance = distanceLeftLeft
      }

      // Выравнивание правого края - важно для изменения ширины
      const distanceRightRight = Math.abs(nodeABounds.right - nodeBBounds.right)
      if (distanceRightRight < verticalDistance) {
        // При изменении размера выравниваем правый край по правому краю других узлов
        result.snapPosition.x = nodeBBounds.right - nodeABounds.width
        result.vertical = nodeBBounds.right
        result.verticalDistance = 0 // Края выравниваются
        verticalDistance = distanceRightRight
      }

      // Выравнивание верхнего края
      const distanceTopTop = Math.abs(nodeABounds.top - nodeBBounds.top)
      if (distanceTopTop < horizontalDistance) {
        result.snapPosition.y = nodeBBounds.top
        result.horizontal = nodeBBounds.top
        horizontalDistance = distanceTopTop
      }

      // Выравнивание нижнего края
      const distanceBottomBottom = Math.abs(nodeABounds.bottom - nodeBBounds.bottom)
      if (distanceBottomBottom < horizontalDistance) {
        result.horizontal = nodeBBounds.bottom
        horizontalDistance = distanceBottomBottom
      }

      // Выравнивание по центру по горизонтали
      const nodeACenterY = nodeABounds.top + nodeABounds.height / 2
      const nodeBCenterY = nodeBBounds.top + nodeBBounds.height / 2
      const distanceCenterY = Math.abs(nodeACenterY - nodeBCenterY)
      if (distanceCenterY < horizontalDistance) {
        result.horizontal = nodeBCenterY
        horizontalDistance = distanceCenterY
      }

      // Выравнивание по центру по вертикали
      const nodeACenterX = nodeABounds.left + nodeABounds.width / 2
      const nodeBCenterX = nodeBBounds.left + nodeBBounds.width / 2
      const distanceCenterX = Math.abs(nodeACenterX - nodeBCenterX)
      if (distanceCenterX < verticalDistance) {
        result.vertical = nodeBCenterX
        verticalDistance = distanceCenterX
      }

      return result
    }, defaultResult)
}


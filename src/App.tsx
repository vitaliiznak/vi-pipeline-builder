/* eslint-disable react/react-in-jsx-scope */
import { Rnd } from 'react-rnd'
import { css } from '@emotion/css'
import { useState } from 'react'
import { nanoid } from 'nanoid'
import { DeleteOutlined, PlusOutlined, PlusSquareOutlined } from '@ant-design/icons'
import { Button, message } from 'antd'
import { DraggableEventHandler } from 'react-draggable'
import Xarrow from 'react-xarrows'

const X_DRAWING_AREA = 130

type T_Node = {
  type: NODE_TYPE
  id: string,
  isWithinDropArea: boolean,
  state: STATE,
  initialPosition: {
    x: number
    y: number
  },
  title: string
}

type T_NodesMap = {
  [key: string]: T_Node
}

enum STATE {
  NEW = 'NEW',
  ON_DIAGRAM = 'ON_DIAGRAM'
}

enum NODE_TYPE {
  QUERY = 'QUERY',
  RETRIVER = 'RETRIVER',
  READER = 'READER'
}

const nodePrototypes = [{
  initialPosition: { x: 0, y: 0 },
  type: NODE_TYPE.QUERY,
  title: 'Query'
},
{
  initialPosition: { x: 0, y: 68 },
  type: NODE_TYPE.RETRIVER,
  title: 'Retriver'
},
{
  initialPosition: { x: 0, y: 136 },
  type: NODE_TYPE.READER,
  title: 'Reader'
}]

const initialNodes = nodePrototypes.reduce((acum, el) => {
  const nodeId = nanoid()
  return {
    [nodeId]: {
      ...el,
      isWithinDropArea: false,
      state: STATE.NEW,
      id: nodeId
    },
    ...acum
  }
}, {} as T_NodesMap)


export default function App() {
  const [nodes, setNodes] = useState<T_NodesMap>(initialNodes)
  const [makeConnectionFrom, setMakeConnectionFrom] = useState<string | null>(null)
  const [connectionsGraphq, setConnectionsGraph] = useState<{ [key: string]: Array<string> }>({})

  const makeOnDragStart: (type: NODE_TYPE) => DraggableEventHandler = (type) => (_e, _dragableData) => {
    const newNodeId = nanoid()
    setNodes({
      ...nodes,
      [newNodeId]: {
        ...nodePrototypes.find(el => el.type === type)!,
        isWithinDropArea: false,
        state: STATE.NEW,
        id: newNodeId
      }
    })
  }

  const makeOnDrag: (node: T_Node) => DraggableEventHandler = (node) => (_e, dragableData) => {
    setNodes({
      ...nodes,
      [node.id]: {
        ...node,
        isWithinDropArea: dragableData.x >= 158
      }
    })
  }

  const makeOnDragStop: (node: T_Node) => DraggableEventHandler = (node) => (_e, dragableData) => {
    if (dragableData.x >= X_DRAWING_AREA) {
      setNodes({ ...nodes, [node.id]: { ...node, isWithinDropArea: true, state: STATE.ON_DIAGRAM } })
    } else if (dragableData.x < X_DRAWING_AREA) {
      delete nodes[node.id]
      setNodes({ ...nodes })
    }
  }

  const onConnect = (from: string | null, to: string) => () => {
    if (!from) return
    if (!connectionsGraphq[from] || !connectionsGraphq[from].includes(to)) {
      setConnectionsGraph({
        ...connectionsGraphq,
        [from]: [...(connectionsGraphq ?? {})[from] ?? [], to]
      })
    }
    setMakeConnectionFrom(null)
  }

  const stableNodeProps = {
    bounds: '#grid',
    resizeGrid: [24, 24] as [number, number],
    dragGrid: [24, 24] as [number, number]
  }

  return (
    <>
      {makeConnectionFrom &&
        <div onClick={setMakeConnectionFrom.bind(null, null)}
          className={css`z-index: 10; top: 0; left: 0; position: fixed; width: 100vw; height: 100vh; background: rgba(250, 250, 250, 0.8);`} />}
      <div className={css`padding: 10px;`}>
        <div
          id='grid'
          className={css`
            height: calc(100vh - 38px);
            display: flex;
          `}
        >
          <div
            className={css`
              width: ${X_DRAWING_AREA}px;
              border-right: solid 1px #212121;
          `}>
            {nodePrototypes.map(({ initialPosition, title, type }) => (
              <Rnd
                key={type}
                {...stableNodeProps}
                disableDragging={true}
                enableResizing={false}
                default={{ ...initialPosition, width: 96, height: 48 }}
                className={css`
                  border: 1px solid #212121;
                  z-index: -1;
                `}
              >
                {title}
              </Rnd>
            ))}
            {Object.values(nodes).map((node) => {
              const { id, initialPosition, isWithinDropArea, state, title, type } = node
              return (
                <Rnd
                  id={id}
                  key={id}
                  {...stableNodeProps}
                  disableDragging={false}
                  enableResizing={state === STATE.ON_DIAGRAM}
                  default={{ ...initialPosition, width: 96, height: 48 }}
                  className={css`
                    border: 1px solid #212121; 
                    ${makeConnectionFrom !== id && isWithinDropArea ? 'z-index: 100;cursor: pointer !important;' : ''}`}

                  onClick={onConnect(makeConnectionFrom, id)}
                  onDragStart={makeOnDragStart(type)}
                  onDrag={makeOnDrag(node)}
                  onDragStop={makeOnDragStop(node)}
                >
                  {isWithinDropArea && state !== STATE.ON_DIAGRAM &&
                    <PlusSquareOutlined
                      className={css`
                        position: absolute;
                        right: -17px;
                        top: -17px;
                        color: green;
                      `}
                    />
                  }

                  {isWithinDropArea && state === STATE.ON_DIAGRAM &&
                    <div
                      className={css`
                          position: absolute;
                          width: 100%;
                          left: 0;
                          bottom: -18px;
                          display:flex;
                        `}>
                      <Button
                        onClick={() => {
                          message.warning('Choose a node to connect with')
                          setMakeConnectionFrom(id)
                        }}
                        className={css`
                          font-size:10px;
                          color: blue;
                          margin: 0 auto;
                        `}
                        type="primary"
                        shape="circle"
                        size="small"
                        icon={<PlusOutlined />} />
                    </div>
                  }

                  {!isWithinDropArea && state === STATE.ON_DIAGRAM &&
                    <DeleteOutlined
                      className={css`
                        position: absolute;
                        right: -17px;
                        top: -17px;
                        color: red;
                      `}
                    />
                  }
                  {title}
                </Rnd>
              )
            })}
          </div>
          <div >
            {Object.entries(connectionsGraphq).map(([from, toArray]) => toArray.map(
              to =>
                <Xarrow
                  key={[from, to].toString()}
                  labels={
                    <Button
                      type="primary"
                      shape="circle"
                      size="small"
                      danger
                      icon={<DeleteOutlined className={css`cursor:pointer;`} size={20} />}
                      onClick={setConnectionsGraph.bind(null, {
                        ...connectionsGraphq,
                        [from]: connectionsGraphq[from].filter(el => el != to)
                      })}
                    />}
                  start={from}
                  end={to} />
            )).flat()}
          </div>
        </div >
      </div >
    </>
  )
}

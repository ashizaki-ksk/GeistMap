import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router'

import compose from 'recompose/compose'
import withProps from 'recompose/withProps'

import {
    loadNode,
    loadNodeL1,
    loadNodeL2,
    connectNodes,
    updateNode,
    removeNode,
    fetchNodeL1,
    removeEdge,
} from '../../actions/node'
import {
    loadCollectionL1,
    removeAbstraction,
    moveToAbstraction,
    removeNodeFromCollection,
} from '../../actions/collection'

import {
    addNode,
    setActiveNode,
    toggleCollapse,
    moveChild,
    moveParent,
    resetAbstractionChain,
} from '../../actions/ui'

import NodeView from '../../components/NodeView'

function loadData(props) {
    // TODO: less data fetching based on which views are visible - 2018-01-12
    return Promise.all([
        props.loadCollectionL1(props.focusNodeId),
        props.loadNodeL2(props.focusNodeId),
        props.nodeId ? props.loadNodeL1(props.nodeId) : Promise.resolve(),
    ])

    // switch(props.graphType) {
    //     case "abstract":
    //     case "hierarchy":
    //         return Promise.all([
    //             props.loadCollectionL1(props.focusNodeId),
    //             props.loadNodeL1(props.focusNodeId)
    //         ])
    //             .then((action) => {
    //                 if (props.nodeId) {
    //                     props.loadNode(props.nodeId)
    //                     return action
    //                 }
    //                 return action
    //             })
    //         break;
    //     case "explore":
    //         return props.loadNodeL2(props.focusNodeId)
    //         break;
    //     default:
    //         console.error("got unexpected graphType", props.graphType)
    // }
}


export class NodeViewContainer extends React.PureComponent {
    constructor(props) {
        super(props)

        this.state = {
            hasLoaded: false
        }

        loadData(props)
            .then(() => {
                if (props.graphType === "abstract") {
                    props.resetAbstractionChain()
                    props.moveChild(props.focusNodeId)
                }
            })
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.focusNodeId !== this.props.focusNodeId || nextProps.nodeId !== this.props.nodeId) {
            loadData(nextProps)
            return this.setState({ hasLoaded: false })
        }

        // TODO: solve this more general, with a hoc or something - 2017-09-16
        if (!nextProps.isLoading) {
            this.setState({ hasLoaded: true })
        }
    }

    render() {
        return (
            <NodeView
                { ...this.props }
                isLoading={!this.state.hasLoaded || this.props.isLoading}
            />
        );
    }
}


import {
    getL2Nodes,
    getL2Edges,
    getL1Nodes,
    getL1Edges,
    getNode,
    getNodesAndEdgesByCollectionId,
    getAbstractionChain,
} from '../../reducers'

function mapStateToProps(state, props) {

    let nodes, edges, nodeTree, isLoading

    const params = new URLSearchParams(props.location.search);
    const graphType = params.get('graphType') || "abstract"

    isLoading = state.loadingStates.GET_COLLECTIONL1 || state.loadingStates.GET_NODE_L1 || state.loadingStates.GET_NODE_L2;

    if (graphType === "abstract" || graphType === "hierarchy") {

        ({ nodes, edges, nodeTree } = getNodesAndEdgesByCollectionId(state, props));

    } else {
        nodes = getL1Nodes(state, props.focusNodeId);
        edges = getL1Edges(state, props.focusNodeId);
        ({ nodeTree } = getNodesAndEdgesByCollectionId(state, props));
    }

    return {
        activeNodeId: props.nodeId,
        activeNode: getNode(state, props.nodeId),
        focusNodeId: props.focusNodeId,
        focusNode: getNode(state, props.focusNodeId),
        mode: state.graphUiState.mode,
        focus: state.graphUiState.focus,
        nodes,
        links: edges,
        nodeTree,
        isLoading,
        graphType: graphType,
        adjacencyMap: state.adjacencyMap, // TODO: should this be passed down? - 2017-09-19
        abstractionSidebarOpened: state.uiState.abstractionSidebar.opened,
        abstractionChain: getAbstractionChain(state),
    };
}

const addProps = withProps(props => {
    const focusNodeId = props.match.params && props.match.params.focusNodeId
    const nodeId = props.match.params && props.match.params.nodeId

    return {
        focusNodeId,
        nodeId,
    }
})

export default compose(
    addProps,
    connect(mapStateToProps, {
        loadCollectionL1,
        addNode,
        connectNodes,
        updateNode,
        removeNode,
        removeNodeFromCollection,
        removeAbstraction,
        setActiveNode,
        toggleCollapse,
        moveToAbstraction,
        loadNode,
        loadNodeL1,
        loadNodeL2,
        removeEdge,
        moveChild,
        moveParent,
        resetAbstractionChain,
    })
)(withRouter(NodeViewContainer))

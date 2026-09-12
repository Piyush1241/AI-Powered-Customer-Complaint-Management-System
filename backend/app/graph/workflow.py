from langgraph.graph import StateGraph, END
from app.graph.state import GraphState
from app.graph.nodes import (
    router_node,
    extraction_node,
    merger_node,
    completeness_node,
    duplicate_node,
    risk_and_capa_node
)

def build_complaint_workflow():
    workflow = StateGraph(GraphState)

    workflow.add_node("router", router_node)
    workflow.add_node("extract", extraction_node)
    workflow.add_node("merge", merger_node)
    workflow.add_node("completeness", completeness_node)
    workflow.add_node("duplicate", duplicate_node)
    workflow.add_node("risk_capa", risk_and_capa_node)

    workflow.set_entry_point("router")
    
    workflow.add_edge("router", "extract")
    workflow.add_edge("extract", "merge")
    workflow.add_edge("merge", "completeness")
    workflow.add_edge("completeness", "duplicate")
    workflow.add_edge("duplicate", "risk_capa")
    workflow.add_edge("risk_capa", END)

    return workflow.compile()

complaint_graph = build_complaint_workflow()

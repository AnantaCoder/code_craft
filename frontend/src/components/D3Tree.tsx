import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface TreeNode {
    name: string;
    value?: string;
    children?: TreeNode[];
    _children?: TreeNode[];
}

interface HierarchyNodeWithCollapse extends d3.HierarchyPointNode<TreeNode> {
    _children?: HierarchyNodeWithCollapse[];
    x0?: number;
    y0?: number;
}

function jsonToTree(data: any, name: string = "root"): TreeNode {
    if (data === null || data === undefined) {
        return { name, value: "null" };
    }

    if (typeof data !== "object") {
        return { name, value: String(data) };
    }

    if (Array.isArray(data)) {
        return {
            name,
            children: data.map((item, index) => jsonToTree(item, `[${index}]`)),
        };
    }

    const entries = Object.entries(data);
    if (entries.length === 0) {
        return { name, value: "{}" };
    }

    return {
        name,
        children: entries.map(([key, value]) => jsonToTree(value, key)),
    };
}

interface D3TreeProps {
    data: any;
}

export default function D3Tree({ data }: D3TreeProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const minimapRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const gRef = useRef<SVGGElement | null>(null);
    const [transform, setTransform] = useState({ x: 50, y: 0, k: 1 });

    useEffect(() => {
        if (!data || !svgRef.current || !containerRef.current) return;

        const treeData = jsonToTree(data);
        const containerWidth = containerRef.current.clientWidth || 800;
        const containerHeight = containerRef.current.clientHeight || 600;

        // Clear previous content
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3
            .select(svgRef.current)
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .style("font", "12px monospace")
            .style("user-select", "none");

        // Create main group for zoom/pan
        const g = svg.append("g").attr("class", "tree-container");
        gRef.current = g.node();

        // Create hierarchy
        const root = d3.hierarchy(treeData) as HierarchyNodeWithCollapse;

        // Dynamic sizing
        const dx = 28;
        const dy = 180;

        // Create tree layout
        const treeLayout = d3.tree<TreeNode>().nodeSize([dx, dy]);

        // Store initial positions
        root.x0 = containerHeight / 2;
        root.y0 = 0;

        // Update function for collapsible tree
        function update(source: HierarchyNodeWithCollapse) {
            const duration = 300;

            // Compute the new tree layout
            const treeRoot = treeLayout(root);
            const nodes = treeRoot.descendants() as HierarchyNodeWithCollapse[];
            const links = treeRoot.links();

            // Normalize for fixed-depth
            nodes.forEach((d) => {
                d.y = d.depth * dy;
            });

            // Update links
            const link = g
                .selectAll<SVGPathElement, d3.HierarchyPointLink<TreeNode>>("path.link")
                .data(links, (d: any) => d.target.data.name + d.target.depth);

            const linkEnter = link
                .enter()
                .append("path")
                .attr("class", "link")
                .attr("fill", "none")
                .attr("stroke", "#fbf0df")
                .attr("stroke-opacity", 0.4)
                .attr("stroke-width", 1.5)
                .attr("d", () => {
                    const o = { x: source.x0 || 0, y: source.y0 || 0 };
                    return diagonal({ source: o, target: o } as any);
                });

            link
                .merge(linkEnter)
                .transition()
                .duration(duration)
                .attr("d", diagonal as any);

            link
                .exit()
                .transition()
                .duration(duration)
                .attr("d", () => {
                    const o = { x: source.x || 0, y: source.y || 0 };
                    return diagonal({ source: o, target: o } as any);
                })
                .remove();

            // Update nodes
            const node = g
                .selectAll<SVGGElement, HierarchyNodeWithCollapse>("g.node")
                .data(nodes, (d: any) => d.data.name + d.depth);

            const nodeEnter = node
                .enter()
                .append("g")
                .attr("class", "node")
                .attr("transform", () => `translate(${source.y0 || 0},${source.x0 || 0})`)
                .attr("cursor", "pointer")
                .on("click", (event, d) => {
                    event.stopPropagation();
                    if (d.children) {
                        (d as any)._children = d.children;
                        d.children = undefined;
                    } else if ((d as any)._children) {
                        d.children = (d as any)._children;
                        (d as any)._children = undefined;
                    }
                    update(d);
                });

            // Node circles
            nodeEnter
                .append("circle")
                .attr("r", 5)
                .attr("fill", (d) =>
                    d.children || (d as any)._children ? "#f3d5a3" : "#4ade80"
                )
                .attr("stroke", (d) => ((d as any)._children ? "#fbf0df" : "none"))
                .attr("stroke-width", 2);

            // Node labels
            nodeEnter
                .append("text")
                .attr("dy", "0.31em")
                .attr("x", (d) => (d.children || (d as any)._children ? -10 : 10))
                .attr("text-anchor", (d) =>
                    d.children || (d as any)._children ? "end" : "start"
                )
                .attr("fill", "#fbf0df")
                .text((d) => d.data.name)
                .clone(true)
                .lower()
                .attr("stroke", "#1a1a1a")
                .attr("stroke-width", 3);

            // Value labels for leaf nodes
            nodeEnter
                .filter((d) => d.data.value !== undefined)
                .append("text")
                .attr("dy", "1.5em")
                .attr("x", 10)
                .attr("text-anchor", "start")
                .attr("fill", "#4ade80")
                .attr("font-size", "10px")
                .text((d) => {
                    const val = d.data.value || "";
                    return val.length > 25 ? val.substring(0, 25) + "..." : val;
                });

            // Transition nodes to their new position
            const nodeUpdate = node.merge(nodeEnter);

            nodeUpdate
                .transition()
                .duration(duration)
                .attr("transform", (d) => `translate(${d.y},${d.x})`);

            nodeUpdate
                .select("circle")
                .attr("fill", (d) =>
                    d.children || (d as any)._children ? "#f3d5a3" : "#4ade80"
                )
                .attr("stroke", (d) => ((d as any)._children ? "#fbf0df" : "none"));

            // Transition exiting nodes
            const nodeExit = node
                .exit()
                .transition()
                .duration(duration)
                .attr("transform", () => `translate(${source.y || 0},${source.x || 0})`)
                .remove();

            nodeExit.select("circle").attr("r", 0);
            nodeExit.select("text").style("fill-opacity", 0);

            // Store positions for next transition
            nodes.forEach((d) => {
                d.x0 = d.x;
                d.y0 = d.y;
            });

            // Update minimap
            updateMinimap();
        }

        // Diagonal path generator
        function diagonal(d: { source: { x: number; y: number }; target: { x: number; y: number } }) {
            return `M${d.source.y},${d.source.x}
              C${(d.source.y + d.target.y) / 2},${d.source.x}
               ${(d.source.y + d.target.y) / 2},${d.target.x}
               ${d.target.y},${d.target.x}`;
        }

        // Zoom behavior
        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
                setTransform({
                    x: event.transform.x,
                    y: event.transform.y,
                    k: event.transform.k,
                });
                updateMinimap();
            });

        svg.call(zoom);

        // Center the tree initially
        const initialTransform = d3.zoomIdentity
            .translate(50, containerHeight / 2)
            .scale(0.9);
        svg.call(zoom.transform, initialTransform);

        // Initial update
        update(root);

        // Minimap
        function updateMinimap() {
            if (!minimapRef.current || !gRef.current) return;

            const minimapSvg = d3.select(minimapRef.current);
            minimapSvg.selectAll("*").remove();

            const minimapWidth = 150;
            const minimapHeight = 100;

            // Get bounds of the tree
            const bounds = gRef.current.getBBox();
            const scale = Math.min(
                minimapWidth / (bounds.width + 40),
                minimapHeight / (bounds.height + 40)
            );

            // Draw tree representation
            const minimapG = minimapSvg
                .append("g")
                .attr(
                    "transform",
                    `translate(${-bounds.x * scale + 5}, ${-bounds.y * scale + 5}) scale(${scale})`
                );

            // Clone simplified tree paths
            minimapG
                .selectAll("circle")
                .data(root.descendants())
                .enter()
                .append("circle")
                .attr("cx", (d: any) => d.y)
                .attr("cy", (d: any) => d.x)
                .attr("r", 3 / scale)
                .attr("fill", "#fbf0df")
                .attr("opacity", 0.6);

            // Viewport indicator
            const currentTransform = d3.zoomTransform(svgRef.current!);
            const viewX = -currentTransform.x / currentTransform.k;
            const viewY = -currentTransform.y / currentTransform.k;
            const viewWidth = containerWidth / currentTransform.k;
            const viewHeight = containerHeight / currentTransform.k;

            minimapG
                .append("rect")
                .attr("x", viewX)
                .attr("y", viewY)
                .attr("width", viewWidth)
                .attr("height", viewHeight)
                .attr("fill", "none")
                .attr("stroke", "#f3d5a3")
                .attr("stroke-width", 2 / scale)
                .attr("opacity", 0.8);
        }
    }, [data]);

    return (
        <div ref={containerRef} className="w-full h-full relative">
            <svg ref={svgRef} className="w-full h-full"></svg>

            {/* Minimap */}
            <div className="absolute bottom-4 right-4 bg-[#1a1a1a]/90 border border-[#fbf0df]/30 rounded-lg p-2">
                <svg ref={minimapRef} width={150} height={100}></svg>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 text-[#fbf0df]/50 text-xs font-mono">
                Click nodes to expand/collapse • Scroll to zoom • Drag to pan
            </div>
        </div>
    );
}

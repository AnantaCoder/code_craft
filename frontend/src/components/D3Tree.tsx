import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface TreeNode {
    name: string;
    value?: string;
    children?: TreeNode[];
    _children?: TreeNode[];
}

interface TooltipState {
    visible: boolean;
    x: number;
    y: number;
    content: string;
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
    const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, content: "" });
    const animationRef = useRef<number | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [isMobile, setIsMobile] = useState(false);

    // Handle resize
    useEffect(() => {
        if (!containerRef.current) return;

        const updateDimensions = () => {
            if (containerRef.current) {
                const width = containerRef.current.clientWidth || 800;
                const height = containerRef.current.clientHeight || 600;
                setDimensions({ width, height });
                setIsMobile(width < 768);
            }
        };

        updateDimensions();

        const resizeObserver = new ResizeObserver(updateDimensions);
        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!data || !svgRef.current || !containerRef.current) return;

        const treeData = jsonToTree(data);
        const containerWidth = dimensions.width;
        const containerHeight = dimensions.height;

        // Clear previous content
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3
            .select(svgRef.current)
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("font", isMobile ? "10px monospace" : "12px monospace")
            .style("user-select", "none")
            .style("touch-action", "none");

        // Create main group for zoom/pan
        const g = svg.append("g").attr("class", "tree-container");
        gRef.current = g.node();

        // Create hierarchy
        const root = d3.hierarchy(treeData) as HierarchyNodeWithCollapse;

        // Dynamic sizing - responsive based on screen size
        const dx = isMobile ? 22 : 28;
        const dy = isMobile ? 120 : 180;

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

            // Add animated flow particles on links
            function animateFlow() {
                const flowGroup = g.selectAll(".flow-group").data([null]);
                const flowEnter = flowGroup.enter().append("g").attr("class", "flow-group");
                const flow = flowEnter.merge(flowGroup as any);

                // Clear previous particles
                flow.selectAll(".flow-particle").remove();

                // Create particles for ALL links (including to leaf/edge nodes)
                links.forEach((linkData, i) => {
                    const particle = flow
                        .append("circle")
                        .attr("class", "flow-particle")
                        .attr("r", 3)
                        .attr("fill", "#f3d5a3")
                        .attr("opacity", 0);

                    // Cubic bezier interpolation matching the diagonal path exactly
                    // The diagonal uses: M(sy,sx) C((sy+ty)/2,sx) ((sy+ty)/2,tx) (ty,tx)
                    // P0 = (source.y, source.x), P1 = ((sy+ty)/2, source.x), P2 = ((sy+ty)/2, target.x), P3 = (target.y, target.x)
                    function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
                        const mt = 1 - t;
                        return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
                    }

                    function animate() {
                        const sx = linkData.source.y; // x position (horizontal)
                        const sy = linkData.source.x; // y position (vertical)
                        const tx = linkData.target.y;
                        const ty = linkData.target.x;
                        const cpx = (sx + tx) / 2; // control point x

                        particle
                            .attr("opacity", 0.8)
                            .attr("cx", sx)
                            .attr("cy", sy)
                            .transition()
                            .duration(1500 + Math.random() * 500)
                            .delay(i * 100 % 500)
                            .ease(d3.easeLinear)
                            .attrTween("cx", () => {
                                return (t: number) => {
                                    // Bezier x: P0=sx, P1=cpx, P2=cpx, P3=tx
                                    return String(cubicBezier(t, sx, cpx, cpx, tx));
                                };
                            })
                            .attrTween("cy", () => {
                                return (t: number) => {
                                    // Bezier y: P0=sy, P1=sy, P2=ty, P3=ty
                                    return String(cubicBezier(t, sy, sy, ty, ty));
                                };
                            })
                            .attr("opacity", 0)
                            .on("end", animate);
                    }

                    setTimeout(animate, i * 150 % 1000);
                });
            }

            // Start flow animation after tree renders
            setTimeout(animateFlow, duration + 100);

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
                .attr("cursor", (d) => (d.children || (d as any)._children) ? "pointer" : "default")
                .on("click", (event, d) => {
                    event.stopPropagation();
                    // Only handle click for nodes that have children (collapsible)
                    if (d.children) {
                        (d as any)._children = d.children;
                        d.children = undefined;
                        update(d);
                    } else if ((d as any)._children) {
                        d.children = (d as any)._children;
                        (d as any)._children = undefined;
                        update(d);
                    }
                    // Leaf nodes (green) - do nothing on click to prevent glitches
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

            // Value labels for leaf nodes with hover tooltip for truncated values
            nodeEnter
                .filter((d) => d.data.value !== undefined)
                .append("text")
                .attr("class", "value-label")
                .attr("dy", "1.5em")
                .attr("x", 10)
                .attr("text-anchor", "start")
                .attr("fill", "#4ade80")
                .attr("font-size", "10px")
                .style("cursor", (d) => (d.data.value && d.data.value.length > 25) ? "help" : "default")
                .text((d) => {
                    const val = d.data.value || "";
                    return val.length > 25 ? val.substring(0, 25) + "..." : val;
                })
                .on("mouseenter", function (event, d) {
                    const val = d.data.value || "";
                    if (val.length > 25) {
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (rect) {
                            setTooltip({
                                visible: true,
                                x: event.clientX - rect.left + 10,
                                y: event.clientY - rect.top - 10,
                                content: val
                            });
                        }
                    }
                })
                .on("mousemove", function (event) {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect && tooltip.visible) {
                        setTooltip(prev => ({
                            ...prev,
                            x: event.clientX - rect.left + 10,
                            y: event.clientY - rect.top - 10
                        }));
                    }
                })
                .on("mouseleave", function () {
                    setTooltip({ visible: false, x: 0, y: 0, content: "" });
                });

            // Also add tooltip for long node names
            nodeEnter
                .select("text")
                .filter(function () {
                    return !d3.select(this).classed("value-label");
                })
                .style("cursor", (d) => d.data.name.length > 20 ? "help" : "inherit")
                .on("mouseenter", function (event, d) {
                    if (d.data.name.length > 20) {
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (rect) {
                            setTooltip({
                                visible: true,
                                x: event.clientX - rect.left + 10,
                                y: event.clientY - rect.top - 10,
                                content: d.data.name
                            });
                        }
                    }
                })
                .on("mouseleave", function () {
                    setTooltip({ visible: false, x: 0, y: 0, content: "" });
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
    }, [data, dimensions, isMobile]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[300px] relative overflow-hidden">
            <svg ref={svgRef} className="w-full h-full touch-none"></svg>

            {/* Tooltip for truncated text */}
            {tooltip.visible && (
                <div
                    className="absolute z-50 px-2 py-1 sm:px-3 sm:py-2 bg-[#2a2a2a] border border-[#fbf0df]/40 rounded-lg shadow-lg text-[#fbf0df] text-[10px] sm:text-xs font-mono max-w-[200px] sm:max-w-xs break-words pointer-events-none"
                    style={{
                        left: Math.min(tooltip.x, dimensions.width - 150),
                        top: Math.max(tooltip.y, 50),
                        transform: 'translateY(-100%)',
                    }}
                >
                    {tooltip.content}
                    <div className="absolute bottom-0 left-3 translate-y-full border-4 border-transparent border-t-[#2a2a2a]"></div>
                </div>
            )}

            {/* Minimap - hidden on very small screens, smaller on mobile */}
            <div className={`absolute bg-[#1a1a1a]/90 border border-[#fbf0df]/30 rounded-lg p-1 sm:p-2 transition-opacity ${isMobile ? 'bottom-2 right-2 opacity-70' : 'bottom-4 right-4'
                } ${dimensions.width < 400 ? 'hidden' : ''}`}>
                <svg
                    ref={minimapRef}
                    width={isMobile ? 100 : 150}
                    height={isMobile ? 66 : 100}
                ></svg>
            </div>

            {/* Instructions - responsive text and positioning */}
            <div className={`absolute text-[#fbf0df]/50 font-mono transition-all ${isMobile
                    ? 'bottom-2 left-2 text-[9px] max-w-[60%]'
                    : 'bottom-4 left-4 text-xs'
                }`}>
                {isMobile
                    ? 'Tap to expand • Pinch to zoom • Drag to pan'
                    : 'Click nodes to expand/collapse • Scroll to zoom • Drag to pan • Hover for full text'
                }
            </div>
        </div>
    );
}

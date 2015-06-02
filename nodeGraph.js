var nodeGraph = {
    //settings object for nodeGraph
    settings: {
        "graphDivID": "nodeConnectionGraph", //the class name that will be targeted for adding the node graph. Example: <div class="nodeConnectionGraph"></div>
        "tagClass": "tagForNodeGraph", //The class where nodeGraph will search for tags to start building the nodes
        "tagClassInParentElement": true, //Are the tags children of tagClass?
        "separatorForNodeConnections": "@", //this allows for tag names such as "_connection_node" and "@connection@node"
        "separatorForSpacesInTags": ".", //If your html does not allow for spaces in tags, substitute for this separator
        "hrefRootForNodes": "", //When building the links on the nodes, we build like: $hrefRootForNodes + nodename. Note: Links can be explicitly defined in the tag
        "graphWidth": 920, //Width of the nodeGraph area
        "graphHeight": 500, //Height of the nodeGraph area
    },
    onLoad: function() {
        //called when page loads

        var self = this;
        self.loadAllReuiredFiles();

    },
    prepareData: function() {
        //grab data from page tags for node graph

        var self = this;


        var pageTitle = $("title").text();
        var pageLink = document.URL;

        var links = [];


        //find all tags
        var tagsSelector = "";
        if (self.settings.tagClassInParentElement == true) {
            tagsSelector = $("." + self.settings.tagClass + " a");
        } else {
            tagsSelector = $("." + self.settings.tagClass);
        }


        tagsSelector.each(function(ele, i) {

            var tagLinkElement = this;

            var tempData = {
                "startNode": "",
                "link": "",
                "endNode": "",
                "startNodeHref": "",
                "endNodeHref": ""
            };

            tempData["startNode"] = pageTitle;
            tempData["startNodeHref"] = pageLink;

            var tagTextValue = $(tagLinkElement).text();

            tagTextValueSplittedValue = tagTextValue.split(self.settings.separatorForNodeConnections);


            var regExpForTextInSquareBrackets = /\[([^)]+)\]/;
            var matchesTextInSquareBrackets = regExpForTextInSquareBrackets.exec(tagTextValue);


            if (tagTextValueSplittedValue.length == 0 || tagTextValueSplittedValue.length == 1) {
                tempData["link"] = "";
                tempData["endNode"] = tagTextValue.split(self.settings.separatorForSpacesInTags).join(" ");
            } else {
                tempData["link"] = tagTextValueSplittedValue[0];
                tempData["endNode"] = tagTextValueSplittedValue[1].split(self.settings.separatorForSpacesInTags).join(" ");
            }


            //generate endNodeHref logic
            if (matchesTextInSquareBrackets != undefined && matchesTextInSquareBrackets.length != 0 && matchesTextInSquareBrackets[1] != undefined) {
                var textInSquareBrackets = matchesTextInSquareBrackets[1];

                tempData["endNode"] = tempData["endNode"].replace(matchesTextInSquareBrackets[0], "");

                tempData["endNodeHref"] = self.settings.hrefRootForNodes + textInSquareBrackets;
            } else if (tagTextValueSplittedValue.length == 0 || tagTextValueSplittedValue.length == 1) {
                tempData["link"] = "tagged with";
                tempData["endNodeHref"] = $(tagLinkElement).attr("href");
            } else {
                tempData["endNodeHref"] = self.settings.hrefRootForNodes + "/" + tempData["endNode"];
            }

            links.push(tempData);

        });

        self.drawNodegraph(links);




    },
    drawNodegraph: function(rawData) {
        //this will draw node graph based on provided data

        var self = this;

        var graphData = {
            nodes: [],
            links: []
        };

        var uniqueNodesObj = {};

        for (var r = 0, rawDataLength = rawData.length; r < rawDataLength; r++) {

            if (uniqueNodesObj[rawData[r]["startNodeHref"]] == undefined) {
                uniqueNodesObj[rawData[r]["startNodeHref"]] = {
                    nodeName: rawData[r]["startNode"],
                    nodeHref: rawData[r]["startNodeHref"]
                };
            }

            if (uniqueNodesObj[rawData[r]["endNodeHref"]] == undefined) {
                uniqueNodesObj[rawData[r]["endNodeHref"]] = {
                    nodeName: rawData[r]["endNode"],
                    nodeHref: rawData[r]["endNodeHref"]
                };
            }

        }
        var nodeIndex = 0;
        for (var nodeHref in uniqueNodesObj) {
            graphData.nodes.push(uniqueNodesObj[nodeHref]);
            uniqueNodesObj[nodeHref]["index"] = nodeIndex;
            nodeIndex++;
        }


        for (var r = 0, rawDataLength = rawData.length; r < rawDataLength; r++) {
            graphData.links.push({
                source: uniqueNodesObj[rawData[r]["startNodeHref"]]["index"],
                target: uniqueNodesObj[rawData[r]["endNodeHref"]]["index"],
                detail: rawData[r]

            });
        }



        var width = 0;
        var height = 0;


        var widthOfGraphDiv = $("#" + self.settings.graphDivID).width();

        if (widthOfGraphDiv != undefined && widthOfGraphDiv != 0) {
            width = widthOfGraphDiv;
        } else {
            width = self.settings.graphWidth;
        }

        var heightOfGraphDiv = $("#" + self.settings.graphDivID).height();

        if (heightOfGraphDiv != undefined && heightOfGraphDiv != 0) {
            height = heightOfGraphDiv;
        } else {
            height = self.settings.graphHeight;
        }

        //d3 force layout function which calculates position of nodes in svg
        var force = d3.layout.force()
            .charge(-200)
            .linkDistance(250)
            .size([width, height]);

        d3.select("#" + self.settings.graphDivID + " svg");

        var svg = d3.select("#" + self.settings.graphDivID)
            .append("svg")
            .attr("width", width)
            .attr("height", height);


        force
            .nodes(graphData.nodes)
            .links(graphData.links)
            .start();


        //draw links
        var link =
            svg.selectAll(".link")
            .data(graphData.links)
            .enter()
            .append("path")
            .attr("class", "link")
            .style("stroke-width", function(d) {
                return 3;
            })
            .style("stroke", function(d) {
                return "#2177B0";
            })
            .style("stroke-opacity", function(d) {
                return "0.6";
            })
            .attr("id", function(d, i) {
                return "linkid-" + i;
            });

        //draw nodes
        var node = svg.selectAll(".node")
            .data(graphData.nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .on("click", function(d) {
                if (d3.event.defaultPrevented) {
                    return;
                }
                window.location.href = d["nodeHref"];
            })
            .style("cursor", "pointer")
            .call(force.drag);


        //function to calculate radius of circle based on links attached to it
        var radiusScaleFn = d3.scale.log()
            .domain(d3.extent(force.nodes(), function(d) {
                return d["weight"];
            }))
            .range([5, 20]);

        var nodeToRadius = {};


        node
            .append("circle")
            .attr("r", function(d) {
                d["circleRadius"] = radiusScaleFn(d.weight) + 20;
                nodeToRadius[d["nodeHref"]] = d["circleRadius"];
                return d["circleRadius"];
            })
            .style("fill", function(d) {
                return "#3C98D9";
            })
            .style("stroke", function(d) {
                return "#3080B9";
            })
            .style("stroke-width", function(d) {
                return "10px";
            });



        // draw node Labels
        var nodeLabel = svg.selectAll(".nodeLabel")
            .data(graphData.nodes)
            .enter()
            .append("text")
            .attr("dy", function(d) {
                return d["circleRadius"] + 15;
            })
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("cursor", "pointer")
            .text(function(d) {
                return d["nodeName"];
            })
            .on("click", function(d) {
                if (d3.event.defaultPrevented) {
                    return;
                }
                window.location.href = d["nodeHref"];
            });


        node.append("title")
            .text(function(d) {
                return d.name;
            });


        //draw link labels
        var linkText = svg.append("svg:g").selectAll("g.linklabelholder").data(force.links());
        linkText.enter().append("g").attr("class", "linklabelholder")
            .append("text")
            .attr("class", "linklabel")
            .style("font-size", "12px")
            .attr("x", function(d) {
                return nodeToRadius[d["detail"]["startNodeHref"]] + 30;
            })
            .attr("y", "-20")
            .attr("text-anchor", "start")
            .style("fill", "#000")
            .attr("dy", "-0.5em")
            .append("textPath")
            .attr("xlink:href", function(d, i) {
                return "#linkid-" + i;
            })
            .text(function(d) {
                var textValue = d["detail"]["link"];
                if (textValue != "") {
                    textValue += " > ";
                }
                return textValue;
            });


        //tick to update position of nodes, links
        force.on("tick", function() {

            link.attr("d", function(d) {
                return "M" + d["source"].x + "," + d["source"].y + "S" + d["target"].x + "," + d["target"].y + " " + d["target"].x + "," + d["target"].y;
            });


            node.attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });


            nodeLabel.attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

            node.each(collide(0.5));
        });




        var collidePadding = 1,
            collideRadius = 50;

        // keep nodes separate from overlapping
        function collide(alpha) {
            var quadtree = d3.geom.quadtree(graphData.nodes);
            return function(d) {
                var rb = 2 * collideRadius + collidePadding,
                    nx1 = d.x - rb,
                    nx2 = d.x + rb,
                    ny1 = d.y - rb,
                    ny2 = d.y + rb;
                quadtree.visit(function(quad, x1, y1, x2, y2) {
                    if (quad.point && (quad.point !== d)) {
                        var x = d.x - quad.point.x,
                            y = d.y - quad.point.y,
                            l = Math.sqrt(x * x + y * y);
                        if (l < rb) {
                            l = (l - rb) / l * alpha;
                            d.x -= x *= l;
                            d.y -= y *= l;
                            quad.point.x += x;
                            quad.point.y += y;
                        }
                    }
                    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                });
            };
        }


    },
    loadAllReuiredFiles: function() {
        //load requried js libraries if not loaded
        var self = this;

        self.loadScript("https://cdnjs.cloudflare.com/ajax/libs/require.js/2.1.17/require.min.js", function() {

            var paths = {};
            if (typeof $ == "undefined") {
                paths["jQuery"] = "https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min";
            }

            if (typeof d3 == "undefined") {
                paths["d3"] = "https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min";
            }
            if (Object.keys(paths).length != 0) {
                requirejs.config({
                    paths: paths
                });

                require(['jQuery', 'd3'], function(a, b) {
                    self.prepareData();
                });
            } else {
                self.prepareData();
            }

        });


    },

    loadScript: function(url, callback) {
        //load js specified in url
        var self = this;

        var script = document.createElement("script");
        script.type = "text/javascript";

        if (script.readyState) {
            script.onreadystatechange = function() {
                if (script.readyState == "loaded" || script.readyState == "complete") {
                    script.onreadystatechange = null;
                    callback();
                }
            };
        } else {
            script.onload = function() {
                callback();
            };
        }

        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    }
};


(function() {
    nodeGraph.onLoad();
})();

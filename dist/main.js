/**
 * The constructor for this abstract class will typically be invoked by concrete
 * sub-classes
 * 
 * @classdesc
 * 
 * <p>
 * An AbstractNode represents an node in the model and contains references to
 * the its parents and children, as well as the previous and next adjacent
 * nodes. An {@link AbstractGraph} is made up of AbstractNodes.
 * </p>
 * 
 * <p>
 * Definitions of specific terms:
 * </p>
 * <ul>
 * <li> <b>parent</b>: x is a parent of y if and only if:
 * <ul>
 * <li>x happens before y and</li>
 * <li>their hosts are not the same and</li>
 * <li>there does not exist any node with x's host that happens after x and
 * before y</li>
 * </ul>
 * </li>
 * 
 * <li><b>child</b>: x is a child of y if and only if:
 * <ul>
 * <li>x happens after y and</li>
 * <li>their hosts are not the same and</li>
 * <li>there does not exist any node with x's host that happens before x and
 * after y</li>
 * </ul>
 * </li>
 * 
 * <li><b>family</b>: x is a family node of y if y is x's parent or child.
 * This implies that x is a family node of y if and only if y is a family node
 * of x</li>
 * 
 * <li><b>next node</b>: x is the next node of y if and only if:
 * <ul>
 * <li>x happens after y and</li>
 * <li>their hosts are the same and</li>
 * <li>there does not exist any node that has the same host that happens before
 * x and after y</li>
 * </ul>
 * </li>
 * 
 * <li><b>prev/previous node</b>: x is the previous node of y is and only if:
 * <ul>
 * <li>x happens before y and</li>
 * <li>their hosts are the same and</li>
 * <li>there does not exist and node that has the same host that happens after
 * x and before y</li>
 * </ul>
 * </li>
 * 
 * <li><b>between</b>: A node n is between nodes x and y if n happens after x
 * and before y OR n happens after y and before x. In addition, nodes x, y, and
 * n must all belong to the same host</li>
 * 
 * <li><b>consecutive</b>: a sequence S of nodes n_1, n_2 ... n_k are
 * consecutive if n_i is the previous node of n_(i+1) for all i between 1 and
 * k-1 inclusive</li>
 * 
 * <li><b>"happens before" and "happens after"</b>: There is a notion of
 * ordering between nodes. More formally, there is a comparison function f(n1,
 * n2) that indicates the ordering of two nodes n1 and n2. For a pair of nodes
 * with the same host, n1 must either happen before (be ordered before) n2 or
 * happens after (be ordered after) n1. If a pair of nodes have different hosts,
 * it could also be the case that neither node happens before or after the
 * other. A node x happens after node y if and only if node y happens before
 * node x. This notion of ordering - this comparison function - may be different
 * for each concrete class that extends node, and it is up to subclasses to
 * precisely define their comparison function, subject to the restrictions
 * above.</li>
 * </ul>
 * 
 * <pre>
 * Pictorially:
 * |  |  |     -- C is a parent of X
 * A  C  E     -- X is a child of C
 * | /|  |     -- A is the previous node of X. A is NOT a parent of X
 * |/ |  |     -- B is the next node of X. B is NOT the child of X
 * X  D  F     -- C is NOT a parent of G nor is G a child of C
 * |  |\ |     -- A X B are consecutive nodes
 * |  | \|     -- X is between A and B
 * B  |  G
 * |  |  |
 * </pre>
 * 
 * <br/> The AbstractNode class makes the following guarantees:
 * <ul>
 * <li>node.getID() is globally unique</li>
 * <li>if node.getNext() != false, then node == node.getNext().getPrev()</li>
 * <li>if node.getPrev() != false, then node == node.getPrev().getNext()</li>
 * <li>if and only if x is a child of y, then y is a parent of x</li>
 * <li>All the children of a node belong to different hosts</li>
 * <li>All the parents of a node belong to different hosts</li>
 * <li>Head and tail nodes have no family</li>
 * </ul>
 * 
 * @abstract
 * @constructor
 */
function AbstractNode() {

    if (this.constructor == AbstractNode) {
        throw new Exception("Cannot instantiate AbstractNode; AbstractNode is an abstract class");
    }

    /** @private */
    this.id = AbstractNode.number++;

    /** @private */
    this.prev = null;

    /** @private */
    this.next = null;

    /** @private */
    this.hostToChild = {};

    /** @private */
    this.hostToParent = {};

    /** @private */
    this.host = null;

    /** @private */
    this.isHeadInner = false;

    /** @private */
    this.isTailInner = false;

    /** @private */
    this.hasHostConstraint = false;

    /** @private */
    this.graph = null;

}

/**
 * Global counter used to assign each node a unique ID
 * 
 * @static
 * @private
 */
AbstractNode.number = 0;

/**
 * Gets the globally unique ID of the node
 * 
 * @returns {Number} the ID
 */
AbstractNode.prototype.getId = function() {
    return this.id;
};

/**
 * Gets the node's host
 * 
 * @returns {String} the name of the host
 */
AbstractNode.prototype.getHost = function() {
    return this.host;
};

/**
 * Determines whether the node is a dummy head node
 * 
 * @returns {Boolean} True if node is head
 */
AbstractNode.prototype.isHead = function() {
    return this.isHeadInner;
};

/**
 * Determines whether the node is a dummy tail node
 * 
 * @returns {Boolean} True if node is tail
 */
AbstractNode.prototype.isTail = function() {
    return this.isTailInner;
};

/**
 * Determines whether the node is a dummy head or tail node
 * 
 * @returns {Boolean} True if node is dummy
 */
AbstractNode.prototype.isDummy = function() {
    return this.isHead() || this.isTail();
};

/**
 * Gets the next node. The next node is the node having the same host as the
 * current one that comes directly after the current node. Note: the next node
 * may be a dummy node (e.g., an isTail node).
 * 
 * @returns {AbstractNode} the next node or null if there is no next node
 *
 */
AbstractNode.prototype.getNext = function() {
    return this.next;
};

/**
 * Gets the previous node. The previous node is the node having the same host as
 * the current one that comes directly before the current node.
 * 
 * @returns {AbstractNode} the previous node or null if there is no previous
 *          node
 */
AbstractNode.prototype.getPrev = function() {
    return this.prev;
};

/**
 * <p>
 * Returns the family nodes of this node as an array.
 * </p>
 * 
 * <p>
 * This function makes no guarantees about the ordering of nodes in the array
 * returned. Also note that a new array is created to prevent modification of
 * the underlying private data structure, so this function takes linear rather
 * than constant time on the number of family nodes.
 * </p>
 * 
 * @returns {Array<AbstractNode>} an array of connected nodes
 */
AbstractNode.prototype.getFamily = function() {
    return this.getParents().concat(this.getChildren());
};

/**
 * <p>
 * Returns the nodes this one is connected to as an array. In the context of
 * this function, a node is said to be connected to this one if it's the
 * previous node, the next node, a parent, or a child. Note that if prev or next
 * is a head or tail or null, it will still be returned.
 * </p>
 * 
 * <p>
 * This function makes no guarantees about the ordering of nodes in the array
 * returned. Also note that a new array is created to prevent modification of
 * the underlying private data structure, so this function takes linear rather
 * than constant time on the number of connections.
 * </p>
 * 
 * @returns {Array<AbstractNode>} an array of connected nodes
 */
AbstractNode.prototype.getConnections = function() {
    return [ this.prev, this.next ].concat(this.getFamily());
};

/**
 * <p>
 * Inserts a node after this one, preserving the invariants described at the top
 * of this document. The node to insert is first removed from its previous
 * location (i.e by calling {@link AbstractNode#remove}). You cannot insert a
 * node after a tail node.
 * </p>
 * 
 * @param {AbstractNode} node The node to insert
 */
AbstractNode.prototype.insertNext = function(node) {
    if (this.next == node) {
        return;
    }

    if (this.isTail()) {
        throw new Exception("AbstractNode.prototype.insertNext: You cannot insert a node after a tail node");
    }

    node.remove();
    node.prev = this;
    node.next = this.next;
    node.prev.next = node;
    node.next.prev = node;

    node.graph = this.graph;
    node.host = this.host;

    this.notifyGraph(new AddNodeEvent(node, node.prev, node.next));
};

/**
 * <p>
 * Inserts a node before this one, preserving the invariants described at the
 * top of this document. The node to insert is first removed from its previous
 * location (i.e by calling {@link AbstractNode#remove}). You cannot insert a
 * node before a head node.
 * </p>
 * 
 * @param {AbstractNode} node The node to insert
 */
AbstractNode.prototype.insertPrev = function(node) {
    if (this.prev == node) {
        return;
    }

    if (this.isHead()) {
        throw new Exception("AbstractNode.prototype.insertPrev: You cannot insert a node before a head node");
    }

    node.remove();
    node.next = this;
    node.prev = this.prev;
    node.next.prev = node;
    node.prev.next = node;

    node.graph = this.graph;
    node.host = this.host;

    this.notifyGraph(new AddNodeEvent(node, node.prev, node.next));
};

/**
 * <p>
 * Removes a node, preserving the invariants described at the top of this
 * document. This method will also remove all connections to the node. Head and
 * tail nodes cannot be removed. This function does nothing if it is called on a
 * node that had already been removed.
 * </p>
 * 
 * <p>
 * Because this method essentially removes all links to and from the node, be
 * careful when using this inside a loop. For example, consider the following
 * code:
 * </p>
 * 
 * <pre>
 * var node = this.getHead(host).getNext();
 * while (!curr.isTail()) {
 *     curr.remove();
 *     curr = curr.getNext(); // sets curr to null! curr.getNext() == null after removal
 * }
 * </pre>
 */
AbstractNode.prototype.remove = function() {
    if (this.isHead() || this.isTail()) {
        throw new Exception("AbstractNode.prototype.remove: Head and tail nodes cannot be removed");
    }

    // nodes that have already been removed will have this.prev == null and
    // this.next == null
    if (!this.prev || !this.next) {
        return;
    }

    var prev = this.prev;
    var next = this.next;

    prev.next = next;
    next.prev = prev;
    this.prev = null;
    this.next = null;

    for (var host in this.hostToParent) {
        var otherNode = this.hostToParent[host];
        delete otherNode.hostToChild[this.host];
        this.notifyGraph(new RemoveFamilyEvent(otherNode, this));
    }

    for (var host in this.hostToChild) {
        var otherNode = this.hostToChild[host];
        delete otherNode.hostToParent[this.host];
        this.notifyGraph(new RemoveFamilyEvent(this, otherNode));
    }

    this.hostToChild = {};
    this.hostToParent = {};

    this.notifyGraph(new RemoveNodeEvent(this, prev, next));

    this.host = null;
    this.graph = null;
};

/**
 * Determines whether the node has children.
 * 
 * @returns {Boolean} True if the node has children
 */
AbstractNode.prototype.hasChildren = function() {
    for (key in this.hostToChild) {
        return true;
    }
    return false;
};

/**
 * Determines whether the node has parents
 * 
 * @returns {Boolean} True if the node has parents
 */
AbstractNode.prototype.hasParents = function() {
    for (key in this.hostToParent) {
        return true;
    }
    return false;
};

/**
 * Determines whether the node has family
 * 
 * @returns {Boolean} True if the node has family
 */
AbstractNode.prototype.hasFamily = function() {
    return this.hasChildren() || this.hasParents();
};

/**
 * <p>
 * Returns parents of this node as an array
 * </p>
 * 
 * <p>
 * This function makes no guarantees about the ordering of nodes in the array
 * returned. Also note that a new array is created to prevent modification of
 * the underlying private data structure, so this function takes linear rather
 * than constant time on the number of parents.
 * </p>
 * 
 * @returns {Array.<AbstractNode>} Array of parent nodes.
 */
AbstractNode.prototype.getParents = function() {
    var result = [];
    for (var key in this.hostToParent) {
        result.push(this.hostToParent[key]);
    }
    return result;
};

/**
 * <p>
 * Returns children of this node as an array
 * </p>
 * 
 * <p>
 * This function makes no guarantees about the ordering of nodes in the array
 * returned. Also note that a new array is created to prevent modification of
 * the underlying private data structure, so this function takes linear rather
 * than constant time on the number of children.
 * </p>
 * 
 * @returns {Array<AbstractNode>} Array of child nodes.
 */
AbstractNode.prototype.getChildren = function() {
    var result = [];
    for (var key in this.hostToChild) {
        result.push(this.hostToChild[key]);
    }
    return result;
};

/**
 * <p>
 * Returns family of this node as an array
 * </p>
 * 
 * <p>
 * This function makes no guarantees about the ordering of nodes in the array
 * returned. Also note that a new array is created to prevent modification of
 * the underlying private data structure, so this function takes linear rather
 * than constant time on the number of family.
 * </p>
 * 
 * @returns {Array<AbstractNode>} Array of family nodes.
 */
AbstractNode.prototype.getFamily = function() {
    return this.getParents().concat(this.getChildren());
};

/**
 * Returns the parent of this node that belongs to a specific host.
 * 
 * @param {String} host The target host
 * @returns {AbstractNode} The parent node or null if no parent belongs to host.
 */
AbstractNode.prototype.getParentByHost = function(host) {
    var result = this.hostToParent[host];
    return !result ? null : result;
};

/**
 * Returns the child of this node that belongs to a specific host.
 * 
 * @param {String} host The target host
 * @returns {AbstractNode} The child node or null if no child belongs to host.
 */
AbstractNode.prototype.getChildByHost = function(host) {
    var result = this.hostToChild[host];
    return !result ? null : result;
};

/**
 * Removes the child of this node that belongs to a specific host. If there is
 * no child that belongs to host, then this method does nothing.
 * 
 * @param {String} host
 */
AbstractNode.prototype.removeChildByHost = function(host) {
    var node = this.getChildByHost(host);
    if (node != null) {
        this.removeChild(node);
    }
};

/**
 * Removes the parent of this node that belongs to a specific host. If there is
 * no parent that belongs to host, then this method does nothing.
 * 
 * @param {String} host
 */
AbstractNode.prototype.removeParentByHost = function(host) {
    var node = this.getParentByHost(host);
    if (node != null) {
        this.removeParent(node);
    }
};

/**
 * <p>
 * Adds a child to this node, preserving the invariants described at the top of
 * this document. Specifically:
 * <li>if and only if x is a child of y, then y is a parent of x</li>
 * <li>All the children of a node belong to different hosts</li>
 * <li>All the parents of a node belong to different hosts</li>
 * </p>
 * 
 * <p>
 * The last two invariants are preserved by calling removeChild or removeParent
 * on any existing children or parents that violate the invariants.
 * </p>
 * 
 * <p>
 * A node x cannot be the child of a node y if they have the same host.
 * </p>
 * 
 * @param {AbstractNode} node The child node to add
 */
AbstractNode.prototype.addChild = function(node) {
    if (node.isHead() || node.isTail()) {
        throw new Exception("AbstractNode.prototype.addChild: Cannot add child to head or tail node");
    }

    if (node.host == this.host) {
        throw new Exception("AbstractNode.prototype.addChild: A node cannot be the child of another node who has the same host");
    }

    if (this.getChildByHost(node.host) == node) {
        return;
    }

    this.removeChildByHost(node.host);
    this.hostToChild[node.host] = node;

    node.removeParentByHost(this.host);
    node.hostToParent[this.host] = this;

    this.notifyGraph(new AddFamilyEvent(this, node));
};

/**
 * <p>
 * Adds a parent to this node, preserving the invariants described at the top of
 * this document. Specifically:
 * <li>if and only if x is a child of y, then y is a parent of x</li>
 * <li>All the children of a node belong to different hosts</li>
 * <li>All the parents of a node belong to different hosts</li>
 * </p>
 * 
 * <p>
 * The last two invariants are preserved by calling removeChild or removeParent
 * on any existing children or parents that violate the invariants.
 * </p>
 * 
 * <p>
 * A node x cannot be the parent of a node y if they have the same host.
 * </p>
 * 
 * @param {AbstractNode} node The node to add as a parent to this
 */
AbstractNode.prototype.addParent = function(node) {
    if (node.isHead() || node.isTail()) {
        throw new Exception("AbstractNode.prototype.addParent: Cannot add parent to head or tail node");
    }

    if (node.host == this.host) {
        throw new Exception("AbstractNode.prototype.addParent: A node cannot be the parent of another node who has the same host");
    }

    if (this.getParentByHost(node.host) == node) {
        return;
    }

    this.removeParentByHost(node.host);
    this.hostToParent[node.host] = node;

    node.removeChildByHost(this.host);
    node.hostToChild[this.host] = this;

    this.notifyGraph(new AddFamilyEvent(node, this));
};

/**
 * Removes the target node from this's children, preserving the invariants
 * described at the top of this document. If the argument is not one of this'
 * children, this method does nothing.
 * 
 * @param {AbstractNode} node
 */
AbstractNode.prototype.removeChild = function(node) {
    if (this.hostToChild[node.host] != node) {
        return;
    }

    delete this.hostToChild[node.host];
    delete node.hostToParent[this.host];

    this.notifyGraph(new RemoveFamilyEvent(this, node));
};

/**
 * Removes the target node from this's parents, preserving the invariants
 * described at the top of this document. If the argument is not one of this'
 * parents, this method does nothing.
 * 
 * @param {AbstractNode} node
 */
AbstractNode.prototype.removeParent = function(node) {
    if (this.hostToParent[node.host] != node) {
        return;
    }

    delete this.hostToParent[node.host];
    delete node.hostToChild[this.host];

    this.notifyGraph(new RemoveFamilyEvent(node, this));
};

/**
 * Removes the target node from this's parents or children, preserving the
 * invariants described at the top of this document. If the argument is not one
 * of this' parents or children, this method does nothing
 * 
 * @param {AbstractNode} node
 */
AbstractNode.prototype.removeFamily = function(node) {
    this.removeChild(node);
    this.removeParent(node);
};

/**
 * Removes all of this node's children while preserving the invariants described
 * at the top of this document.
 */
AbstractNode.prototype.clearChildren = function() {
    for (var host in this.hostToChild) {
        this.removeChild(this.hostToChild[host]);
    }
};

/**
 * Removes all of this node's parents while preserving the invariants described
 * at the top of this document.
 */
AbstractNode.prototype.clearParents = function() {
    for (var host in this.hostToParent) {
        this.removeParent(this.hostToParent[host]);
    }
};

/**
 * Removes all of this node's family while preserving the invariants described
 * at the top of this document.
 */
AbstractNode.prototype.clearFamily = function() {
    this.clearChildren();
    this.clearParents();
};

/**
 * @private
 * @param event
 */
AbstractNode.prototype.notifyGraph = function(event) {
    if (this.graph != null) {
        this.graph.notify(event);
    }
};

/**
 * Constructs a LogEvents given the log text, a {@link VectorTimestamp} and the
 * line number associated with this log event <>
 * 
 * @classdesc
 * 
 * A LogEvent represents a single event from the raw log and contains the text
 * of the log, a reference to the {@link VectorTimestamp}, and other contextual
 * information. LogEvents are immutable.
 * 
 * @constructor
 * @param {String} text the text of the log (description)
 * @param {VectorTimestamp} vectorTimestamp the vector timestamp of the log
 * @param {Number} lineNum the line number of the event in the log
 * @param {?Object<String, String>} [fields={}] a mapping of field names to
 *            field values extracted using regex.
 */
function LogEvent(text, vectorTimestamp, lineNum, fields) {
    /** @private */
    this.id = LogEvent.id++;

    /** @private */
    this.text = text;

    /** @private */
    this.host = vectorTimestamp.getOwnHost();

    /** @private */
    this.vectorTimestamp = vectorTimestamp;

    /** @private */
    this.lineNum = lineNum;

    /** @private */
    this.fields = Util.objectShallowCopy(fields) || {};
}

/**
 * Used to assign LogEvents unique IDs
 * 
 * @private
 * @static
 */
LogEvent.id = 0;

/**
 * Returns the LogEvent's unique ID
 * 
 * @returns {Number} the ID
 */
LogEvent.prototype.getId = function() {
    return this.id;
};

/**
 * Returns the log text associated with this LogEvent
 * 
 * @returns {String} the log text
 */
LogEvent.prototype.getText = function() {
    return this.text;
};

/**
 * Returns the host that the LogEvent was generated by
 * 
 * @returns {String} the name of the host
 */
LogEvent.prototype.getHost = function() {
    return this.host;
};

/**
 * Returns the VectorTimestamp associated with this LogEvent
 * 
 * @returns {VectorTimestamp}
 */
LogEvent.prototype.getVectorTimestamp = function() {
    return this.vectorTimestamp;
};

/**
 * Returns line number in the raw input string that this log event was parsed
 * from.
 * 
 * @returns {Number}
 */
LogEvent.prototype.getLineNumber = function() {
    return this.lineNum;
};

/**
 * Returns the custom captured fields for the log event.
 * 
 * @returns {Object<String, String>} The fields
 */
LogEvent.prototype.getFields = function() {
    return $.extend({}, this.fields);
};
class ModelGraph {

  constructor(_config, data) {
    this.config = {
      //parentElement: _config.parentElement, 
    }
    
    this.data = data;
    this.initGraph();
  }

  initGraph() {
    let graph = this;

    graph.hosts = d3.map(graph.data, d => d.host).keys();

    graph.events = {};

    // Events per host
    graph.data.forEach(d => {
      if(!(d.host in graph.events)) {
        graph.events[d.host] = [];
      }
      // Convert datetime string to date object
      if(app.temporalOrder == "physical") {
        d.fields.timestamp = moment(d.fields.date).toDate();
        d.fields.time_numeric = d.fields.timestamp.getTime();
      } else {
        d.fields.time_numeric = index;
      }

      graph.events[d.host].push(d);
    });

    // Get happened-before relationships
    for(let host in graph.events) {
      graph.events[host].forEach((d,index) => {

        if(index > 0) {
          d.happenedBefore = graph.getHappenedBefore(d, graph.events[host][index-1]);
        // Special case: add generic init event if this host starts with a connection to an external host
        } else if(Object.keys(d.vectorTimestamp.clock).length > 1) {
          let prevEvent = {} // Create artifical start event
          prevEvent = { host: d.host, vectorTimestamp: { clock: {} }};
          prevEvent.vectorTimestamp.clock[d.host] = 0;
          d.happenedBefore = graph.getHappenedBefore(d, prevEvent);
        }
      });
    }

    // Compute layout (y-positions)
    let hostIterator = {};

    graph.hosts.forEach(d => {
      hostIterator[d] = { host:d, pos:0, index:0 };
    });
    graph.computeVerticalNodePositionsPerHost(hostIterator, graph.hosts[0]);
    
    graph.displayData = [];
    for(let host in graph.events) {
      graph.displayData = graph.displayData.concat(graph.events[host]);
    }

    graph.edges = graph.displayData.filter(d => {
      return d.happenedBefore && d.happenedBefore.type == "external";
    });
  }

  getNodes() {
    return this.displayData;
  }

  getEdges() {
    return this.edges;
  }

  getFilteredEdges(nodes) {
    return nodes.filter(d => {
      return d.happenedBefore && d.happenedBefore.type == "external";
    });
  }
  
  computeVerticalNodePositionsPerHost(hostIterator, host) {
    let graph = this;

    for (let i = hostIterator[host].index; i < graph.events[host].length; i++) {
      let currEvent = graph.events[host][i];

      if(currEvent.pos >= 0) {
        continue;
      }

      // Child connection
      if(!currEvent.happenedBefore || currEvent.happenedBefore.type == "child") {
        hostIterator[host].pos++;
        hostIterator[host].index++;
        currEvent.pos = hostIterator[host].pos;
      } else {
        // Check if y-position for previous event already exists
        let happenedBeforeEvent = currEvent.happenedBefore.event;
        if(!happenedBeforeEvent.hasOwnProperty("pos")) {
          // First compute y-position for related host before continuing in this host
          graph.computeVerticalNodePositionsPerHost(hostIterator, happenedBeforeEvent.host);
          if(currEvent.pos >= 0) {
            continue;
          }
        }
        hostIterator[host].pos = Math.max(hostIterator[host].pos + 1, happenedBeforeEvent.pos + 1);
        hostIterator[host].index++;
        currEvent.pos = hostIterator[host].pos;
      }
    }
  }

  getHappenedBefore(currEvent, prevEvent) {
    let graph = this;
    // Compare current and previous event to see if other clock values have been updated
    let updatedHosts = currEvent.vectorTimestamp.compareUpdatedHosts(prevEvent.vectorTimestamp);

    // Find happened-before event at external host
    if (updatedHosts.length > 0) {
      for (let i = 0; i < updatedHosts.length; i++) {
        const host = updatedHosts[i];

        // Get event with the same clock value
        let happenedBeforeEvent = graph.getEventByClockValue(host, currEvent.vectorTimestamp.clock[host]);
        
        // Check if all hosts match in this event compared to currEvent.
        if (currEvent.vectorTimestamp.compareHosts(happenedBeforeEvent.vectorTimestamp, updatedHosts)) {
          return { type: "external", event: happenedBeforeEvent };
        }
      }
    }
    
    // currEvent has no connection to external hosts
    return { type: "child", event: prevEvent };
  }

  getEventByClockValue(host, clockValue) {
    let graph = this;

    for (let i = 0; i < graph.events[host].length; i++) {
      let currClockValue = graph.events[host][i].vectorTimestamp.clock[host];
      if (currClockValue == clockValue) {
        return graph.events[host][i];
      }
    }
  }
}
/**
 * Constructs a ModelNode given an array of {@link LogEvent}s that the
 * ModelNode should represent
 * 
 * @classdesc
 * 
 * ModelNodes are part of {@link ModelGraph}s. Together, they model a set of
 * {@link LogEvent}s. A ModelNode by itself can model one or more LogEvents
 * 
 * @constructor
 * @extends AbstractNode
 * @param {Array<LogEvent>} logEvents The array of LogEvents from which a
 *            ModelGraph should be constructed
 */
function ModelNode(logEvents) {
    AbstractNode.call(this);

    /** @private */
    this.logEvents = logEvents.slice();
}

// ModelNode extends AbstractNode
ModelNode.prototype = Object.create(AbstractNode.prototype);
ModelNode.prototype.constructor = ModelNode;

/**
 * <p>
 * Gets the log events associated with the node
 * </p>
 * 
 * <p>
 * This function makes no guarantees about the ordering of LogEvents in the
 * array returned. Also note that a new array is created to prevent modification
 * of the underlying private data structure, so this function takes linear
 * rather than constant time on the number of LogEvents.
 * </p>
 * 
 * @returns {Array<LogEvent>} an array of associated log events
 */
ModelNode.prototype.getLogEvents = function() {
    return this.logEvents.slice();
};

/**
 * Gets the first LogEvent associated with this node. The first log event is
 * simply the first element passed in the array of log events passed to the
 * constructor. This is equivalent to calling {@link ModelNode#GetLogEvents}()[0].
 * If there is no first LogEvent, this method returns null.
 * 
 * @returns {LogEvent} the first log event.
 */
ModelNode.prototype.getFirstLogEvent = function() {
    if (this.logEvents.length == 0) {
        return null;
    }
    return this.logEvents[0];
};

/**
 * Gets the number of {@link LogEvent}s this node holds
 * 
 * @returns {Number} the number of LogEvents
 */
ModelNode.prototype.getLogEventCount = function() {
    return this.logEvents.length;
};

/**
 * Constructs a LogParser to parse the provided raw log text.
 * 
 * @classdesc
 * 
 * <p>
 * LogParser can be used to transform raw log text to {@link LogEvent}s The
 * LogParser class per se is only responsible for dividing the raw text into
 * different executions according to the supplied delimiter. It then creates one
 * {@link ExecutionParser} for each execution to which to task for parsing is
 * then delegated.
 * </p>
 * 
 * <p>
 * The raw log potentially contains text for multiple executions. Delimiters
 * demarcate where one execution's text ends and another begins. Labels can be
 * given to executions by specifying a "trace" capture group within the
 * delimiter regex. (So the label text must be part of the delimiter). This
 * label can later be used to identify an execution. If an execution's text is
 * not preceeded by a delimiter, it is given the empty string as its label.
 * </p>
 * 
 * @constructor
 * @param {String} rawString the raw log text
 * @param {NamedRegExp} delimiter a regex that specifies the delimiter. Anything
 *            that matches the regex will be treated as a delimiter. A delimiter
 *            acts to separate different executions.
 * @param {NamedRegExp} regexp A regex that specifies the log parser. The parser
 *            must contain the named capture groups "clock", "event", and "host"
 *            representing the vector clock, the event string, and the host
 *            respectively.
 */
function LogParser(rawString, delimiter, regexp) {

    /** @private */
    this.rawString = rawString.trim();

    /** @private */
    this.delimiter = delimiter;

    /** @private */
    this.regexp = regexp;

    /** @private */
    this.labels = [];

    /** @private */
    this.executions = {};

    var names = this.regexp.getNames();
    if (names.indexOf("clock") < 0 || names.indexOf("host") < 0 || names.indexOf("event") < 0) {
        var e = new Exception("The parser RegExp you entered does not have the necessary named capture groups.\n", true);
        e.append("Please see the documentation for details.");
        throw e;
    }

    if (this.delimiter != null) {
        var currExecs = this.rawString.split(this.delimiter.no);
        var currLabels = [ "" ];

        if (this.delimiter.getNames().indexOf("trace") >= 0) {
            var match;
            while (match = this.delimiter.exec(this.rawString)) {
                currLabels.push(match.trace);
            }
        }

        for (var i = 0; i < currExecs.length; i++) {
            if (currExecs[i].trim().length > 0) {
                var currlabel = currLabels[i];
                if(this.executions[currlabel]) {
                    throw new Exception("Execution names must be unique. There are multiple executions called \"" + currlabel + "\"", true);
                }
                this.executions[currlabel] = new ExecutionParser(currExecs[i], currlabel, regexp);
                this.labels.push(currlabel);
            }
        }
    }
    else {
        this.labels.push("");
        this.executions[""] = new ExecutionParser(this.rawString, "", regexp);
    }
}

/**
 * Gets all of the labels of the executions. The ordering of labels in the
 * returned array is guarenteed to be the same as the order in which they are
 * encountered in the raw log text
 * 
 * @returns {Array<String>} An array of all the labels.
 */
LogParser.prototype.getLabels = function() {
    return this.labels.slice();
};

/**
 * Returns the {@link LogEvent}s parsed by this. The ordering of LogEvents in
 * the returned array is guaranteed to be the same as the order in which they
 * were encountered in the raw log text
 * 
 * @param {String} label The label of the execution you want to get log events
 *            from.
 * @returns {Array<LogEvent>} An array of LogEvents
 */
LogParser.prototype.getLogEvents = function(label) {
    if (!this.executions[label])
        return null;
    return this.executions[label].logEvents;
};

/**
 * @classdesc
 * 
 * ExecutionParser parses the raw text for one execution.
 * 
 * @constructor
 * @private
 * @param {String} rawString The raw string of the execution's log
 * @param {Label} label The label that should be associated with this execution
 * @param {NamedRegExp} regexp The RegExp parser
 */
function ExecutionParser(rawString, label, regexp) {

    /** @private */
    this.rawString = rawString;

    /** @private */
    this.label = label;

    /** @private */
    this.timestamps = [];

    /** @private */
    this.logEvents = [];

    var match;
    while (match = regexp.exec(rawString)) {
        var newlines = rawString.substr(0, match.index).match(/\n/g);
        var ln = newlines ? newlines.length + 1 : 1;

        var clock = match.clock;
        var host = match.host;
        var event = match.event;

        var fields = {};
        regexp.getNames().forEach(function(name, i) {
            if (name == "clock" || name == "event")
                return;

            fields[name] = match[name];
        });

        var timestamp = parseTimestamp(clock, host, ln);
        this.timestamps.push(timestamp);
        this.logEvents.push(new LogEvent(event, timestamp, ln, fields));
    }

    if (this.logEvents.length == 0)
        throw new Exception("The parser RegExp you entered does not capture any events for the execution " + label, true);

    function parseTimestamp(clockString, hostString, line) {
        try {
            clock = JSON.parse(clockString);
        }
        catch (err) {
            var exception = new Exception("An error occured while trying to parse the vector timestamp on line " + (line + 1) + ":");
            exception.append(clockString, "code");
            exception.append("The error message from the JSON parser reads:\n");
            exception.append(err.toString(), "italic");
            exception.setUserFriendly(true);
            throw exception;
        }

        try {
            var ret = new VectorTimestamp(clock, hostString);
            return ret;
        }
        catch (exception) {
            exception.prepend("An error occured while trying to parse the vector timestamp on line " + (line + 1) + ":\n\n");
            exception.append(clockString, "code");
            exception.setUserFriendly(true);
            throw exception;
        }
    }

}

/**
 * Constructs a VectorTimestamp with the provided clock and host.
 * 
 * @classdesc
 * 
 * A VectorTimestamp is a timestamp used according to the
 * {@link http://en.wikipedia.org/wiki/Vector_clock Vector Clock Algorithm} It
 * is so named because it contains a vector of numerical clock values for
 * different hosts. VectorTimestamps are immutable.
 * 
 * @see {@link http://en.wikipedia.org/wiki/Vector_clock Wikipedian explanation of the Vector Clock algorithm}
 * @constructor
 * @param {Object<String, Number>} clock The vector clock with host names
 *            corresponding to timestamps for host
 * @param {String} host The host the timestamp belongs to
 * @throws {String} An error string if the vector clock does not contain an
 *             entry for the host
 */
function VectorTimestamp(clock, host) {
    /** @private */
    this.clock = Util.objectShallowCopy(clock);

    /** @private */
    this.host = host;

    /** @private */
    this.ownTime = clock[this.host];

    if (!clock.hasOwnProperty(host)) {
        var exp = new Exception("Local host \"" + host + "\" is missing from timestamp:");
        throw exp;
    }

    for (var host in this.clock) {
        if (this.clock[host] == 0) {
            delete this.clock[host];
        }
    }
}

/**
 * Returns the host name of the host this vector timestamp belongs to
 * 
 * @returns {String} The host name
 */
VectorTimestamp.prototype.getOwnHost = function() {
    return this.host;
};

/**
 * Returns the clock value of the host
 * 
 * @returns {Number} The clock value
 */
VectorTimestamp.prototype.getOwnTime = function() {
    return this.ownTime;
};

/**
 * Returns the entire vector clock as a JSON object
 * 
 * @returns {Object} the clock
 */
VectorTimestamp.prototype.getClock = function() {
    var clock = {};
    for(var key in this.clock) {
        clock[key] = this.clock[key];
    }
    return clock;
};

/**
 * <p>
 * Returns a vector timestamp that is this updated with the argument. The
 * timestamp updating is done according to the
 * {@link http://en.wikipedia.org/wiki/Vector_clock Vector Clock algorithm}.
 * That is, for each key in the set of all keys, newVT.clock[key] =
 * max(this.clock[key], other.clock[key]). The host of the returned timestamp is
 * the same as the host of this.
 * </p>
 * 
 * <p>
 * Note that the returned timestamp is the updated timestamp. Neither this nor
 * the argument timestamp is modified in any way, as VectorTimestamps are
 * immutable
 * </p>
 * 
 * @see {@link http://en.wikipedia.org/wiki/Vector_clock Wikipedian explanation of the Vector Clock algorithm}
 * @param {VectorTimestamp} other The other timestamp used to update the current
 *            one
 * @returns {VectorTimestamp} The updated vector timestamp.
 */
VectorTimestamp.prototype.update = function(other) {
    var clock = {};
    for (var key in this.clock) {
        clock[key] = this.clock[key];
    }

    for (var key in other.clock) {
        if (!clock.hasOwnProperty(key)) {
            clock[key] = other.clock[key];
        }
        clock[key] = Math.max(clock[key], other.clock[key]);
    }
    return new VectorTimestamp(clock, this.host);
};

/**
 * <p>
 * Gets the vector timestamp that is identical to this current one, except its
 * own hosts clock has been incremented by one.
 * </p>
 * 
 * <p>
 * Note that this method does not modify this, as VectorTimestamps are
 * immutable.
 * </p>
 * 
 * @returns {VectorTimestamp} A vector timestamp identical to this, except with
 *          its own host's clock incremented by one
 */
VectorTimestamp.prototype.increment = function() {
    var clock = {};
    for (var key in this.clock) {
        clock[key] = this.clock[key];
    }
    clock[this.host]++;
    return new VectorTimestamp(clock, this.host);
};

/**
 * <p>
 * Checks if this VectorTimestamp is equal to another. Two vector timestamps are
 * considered equal if they have they exact same host and the exact same
 * key-value pairs.
 * </p>
 * 
 * @param {VectorTimestamp} other The other VectorTimestamp to compare against
 * @returns {Boolean} True if this equals other
 */
VectorTimestamp.prototype.equals = function(other) {
    for (var key in this.clock) {
        if (this.clock[key] != other.clock[key]) {
            return false;
        }
    }

    for (var key in other.clock) {
        if (other.clock[key] != this.clock[key]) {
            return false;
        }
    }

    return this.host == other.host;
};

/**
 * <p>
 * Compares two vector timestamp.
 * </p>
 * 
 * <p>
 * Returns a negative number if this timestamp happens before other. Returns a
 * positive number if other timestamp happens before this. Returns zero if both
 * are concurrent or equal.
 * </p>
 * 
 * <p>
 * Let x[host] be the logical clock value for host in vector clock x. A vector
 * timestamp x is said to happen before y if for all hosts, x[host] <= y[host]
 * AND there exists at least one host h such that x[h] < y[h]. x and y are said
 * to be concurrent if x does not happen before y AND y does not happen before x
 * </p>
 * 
 * @param {VectorTimestamp} other the timestamp to compare to
 * @returns {Number} the result of the comparison as defined above
 */
VectorTimestamp.prototype.compareTo = function(other) {
    var thisFirst = false;
    for (var host in this.clock) {
        if (other.clock[host] != undefined && this.clock[host] < other.clock[host]) {
            thisFirst = true;
            break;
        }
    }

    var otherFirst = false;
    for (var host in other.clock) {
        if (this.clock[host] != undefined && other.clock[host] < this.clock[host]) {
            otherFirst = true;
            break;
        }
    }

    if (thisFirst && !otherFirst) {
        return -1;
    }
    if (otherFirst && !thisFirst) {
        return 1;
    }
    return 0;
};


/**
 * <p>
 * Compare two timestamps based on their local times only.
 * </p>
 * 
 * <p>
 * Returns zero if this.host is not equal to other.host. Returns a negative
 * number if this happens before other. Returns a positive number is other
 * happens before this.
 * </p>
 * 
 * <p>
 * A vector clock x is said to happen before y if they have the same host and
 * x[host] < y[host]
 * </p>
 * 
 * @param {VectorTimestamp} other the timestamp to compare to
 * @returns {Number} the result of the comparison as defined above
 */
VectorTimestamp.prototype.compareToLocal = function(other) {
    if (this.host != other.host) {
        return 0;
    }

    return this.clock[this.host] - other.clock[other.host];
};

/**
 * Compare two timestamps and check if hosts are added or updated.
 * 
 * @param {VectorTimestamp} other the timestamp to compare to
 * @returns {Array} array of hosts that have been updated
 */
VectorTimestamp.prototype.compareUpdatedHosts = function(other) {
    let updatedHosts = [];
    for (let host in this.clock) {
        if (other.clock[host] == undefined || this.clock[host] != other.clock[host]) {
            if(this.host != host) {
                updatedHosts.push(host);
            }
        }
    }
    return updatedHosts;
};

/**
 * Check if two vector timestamps have the given hosts ('updatedHosts') and their clock values match.
 * Needed to resolve happened-before relationship
 * 
 * @param {VectorTimestamp} other the timestamp to compare to
 * @param {Array} hosts for comparison
 * @returns {Array} array of hosts that have been updated
 */
VectorTimestamp.prototype.compareHosts = function(other, updatedHosts) {
    for (let i = 0; i < updatedHosts.length; i++) {
        let host = updatedHosts[i];
        if (!this.clock.hasOwnProperty(host) || !other.clock.hasOwnProperty(host) || this.clock[host] != other.clock[host]) {
            return false;
        }
    }
    return true;
};


/**
 * Constructs a new {@link VectorTimestamp} serializer with the specified
 * format, separator, header and footer
 * 
 * @classdesc
 * 
 * <p>
 * This class can be used to serialize a list of {@link VectorTimestamp}s into
 * a string. The serialization can be customized using the format, separator,
 * header, and footer params. The purpose of each of those is described below.
 * </p>
 * 
 * <p>
 * For example, if format="`HOST`:`CLOCK`", separator="," , header="[",
 * footer="]", and the vector timestamps to serialize were "a {'a':1}" and "b
 * {'b':1, 'a':1}", the resulting serialization would be
 * "[a:{'a':1},b:{'b':1,'a':1}]"
 * </p>
 * 
 * @constructor
 * @param {String} format The format string describes how to serialize each
 *            vector timestamp. It can be any arbitrary string. For each vector
 *            timestamp, the substring in the format string equal to
 *            {@link VectorTimestampSerializer.HOST_PLACEHOLDER} will be
 *            replaced with the timestamp's host, and
 *            {@link VectorTimestampSerializer.CLOCK_PLACEHOLDER} will be
 *            replaced with the timestamp's clock.
 * @param {String} separator The separator string is placed in between each
 *            serialized vector timestamp.
 * @param {String} header The header string is prepended to the beginning of the
 *            rest of the serialization
 * @param {String} footer the footer string is appended to the end of the rest
 *            of the serialization
 */
function VectorTimestampSerializer(format, separator, header, footer) {

    /** @private */
    this.format = format;

    /** @private */
    this.separator = separator;

    /** @private */
    this.header = header;

    /** @private */
    this.footer = footer;
}

/**
 * @static
 * @const
 */
VectorTimestampSerializer.HOST_PLACEHOLDER = "`HOST`";

/**
 * @static
 * @const
 */
VectorTimestampSerializer.CLOCK_PLACEHOLDER = "`CLOCK`";

/**
 * Serializes an array of vector timestamps. The timestamps will be serialized
 * in the order they are found in the array.
 * 
 * @param {Array<VectorTimestamp>} The vector timestamps to serialize.
 * @returns {String} The resulting serialization
 */
VectorTimestampSerializer.prototype.serialize = function(vectorTimestamps) {
    var context = this;

    return this.header + vectorTimestamps.map(function(vt) {
        return context.format.replace(VectorTimestampSerializer.HOST_PLACEHOLDER, vt.getOwnHost()) //
        .replace(VectorTimestampSerializer.CLOCK_PLACEHOLDER, JSON.stringify(vt.getClock()));
    }).join(this.separator) + this.footer;
};

class AdjacencyMatrix {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      
    }
    
    this.config.margin = _config.margin || { top: 80, bottom: 5, right: 0, left: 100 };
    
    this.initVis();
  }
  
  initVis() {
    let vis = this;
    
    vis.svgContainer = d3.select(vis.config.parentElement).append("svg");
    
    vis.svg = vis.svgContainer.append("g")
        .attr("transform", "translate(" + vis.config.margin.left + "," + vis.config.margin.top + ")");

    vis.focus = vis.svg.append("g");
    vis.matrix = vis.focus.append("g");

    // Initialize scales and axes
    vis.xScale = d3.scaleBand();
    vis.yScale = d3.scaleBand();

    vis.xAxis = d3.axisTop(vis.xScale);
    vis.yAxis = d3.axisLeft(vis.yScale);

    vis.xAxisGroup = vis.focus.append("g")
        .attr("class", "axis axis--x");

    vis.yAxisGroup = vis.focus.append("g")
        .attr("class", "axis axis--y");
  }
  
  wrangleDataAndUpdateScales() {
    let vis = this;  
    
    vis.hosts = d3.map(vis.data, d => d.host).keys();

    // Clone object array and then sort by host name
    //vis.edges = Object.assign({}, vis.edges); 

    vis.data.sort((a,b) => d3.ascending(a.host, b.host));

    

    // Count edges between host pair
    let tmpData = {};
    vis.data.forEach(d => {
      if(!d.happenedBefore) return;
      let source = d.host;
      let target = d.host;
      let external = false;
      if (d.happenedBefore.type == "external") {
        target = d.happenedBefore.event.host;
        external = true;
      }
      const key = source + ";" + target;
      if (!(key in tmpData)) {
        tmpData[key] = 0;
      }
      tmpData[key]++;

      // Hack to count links only once (needs to be refactored)
      if(external) {
        const key = target + ";" + target;
        if (!(key in tmpData)) {
          tmpData[key] = 0;
        }
        tmpData[key]--;
      }
    });

    // Transform associative to regular array
    vis.displayData = [];
    for (var k in tmpData){
      if (tmpData.hasOwnProperty(k) && tmpData[k] > 0) {
        const nodes = k.split(";");
        vis.displayData.push({ "source":nodes[0], "target":nodes[1], "value":tmpData[k] });
      }
    }

    console.log(vis.data);
    console.log(vis.displayData);

    // Update container size
    vis.config.containerWidth = $(vis.config.parentElement).width();
    vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        
    vis.config.containerHeight = $(vis.config.parentElement).height() - app.offsetTop;
    vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    
    vis.svgContainer
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    vis.config.cellWidth = Math.max(vis.config.width,vis.config.height) / vis.hosts.length;
    vis.config.cellWidth = vis.config.cellWidth > 50 ? 50 : vis.config.cellWidth;

    vis.config.matrixWidth = vis.config.cellWidth * vis.hosts.length;

    // Update scales
    vis.xScale = vis.xScale
        .domain(vis.hosts)
        .range([0, vis.config.matrixWidth]);

    vis.yScale = vis.yScale
        .domain(vis.hosts)
        .range([0, vis.config.matrixWidth]);

    vis.colorScale = d3.scaleSequential()
        .domain(d3.extent(vis.displayData, d => d.value))
        .interpolator(d3.interpolateBlues);
    
    vis.updateVis();
  }
  
  updateVis() {
    let vis = this;

    // Draw links
    let cell = vis.matrix.selectAll(".cell")
        .data(vis.displayData);

    let cellEnter = cell.enter().append("rect")
        .attr("class", "cell");
    
    cellEnter.merge(cell)
      .transition()
        .attr("x", d => vis.xScale(d.source))
        .attr("y", d => vis.yScale(d.target))
        .attr("width", vis.config.cellWidth)
        .attr("height", vis.config.cellWidth)
        .attr("fill", d => vis.colorScale(d.value));
    
    cell.exit().remove();

    // Draw axes and grid lines
    vis.yAxisGroup.call(vis.yAxis);
    vis.xAxisGroup.call(vis.xAxis)
      .selectAll("text")
        .attr("text-anchor", "end")
        .attr("dx", ".15em")
        .attr("dy", ".25em")
        .attr("transform", "translate(-10,-10) rotate(90)");
    
    let gridlineX = vis.focus.selectAll(".gridline-x")
        .data(vis.hosts);

    let gridlineXEnter = gridlineX.enter().append("line")
        .attr("class", "gridline gridline-x");

    gridlineXEnter.merge(gridlineX)
      .transition()
        .attr("x1", d => vis.xScale(d) + vis.config.cellWidth)
        .attr("y1", 0)
        .attr("x2", d => vis.xScale(d) + vis.config.cellWidth)
        .attr("y2", vis.config.matrixWidth);

    gridlineX.exit().remove();

    let gridlineY = vis.focus.selectAll(".gridline-y")
        .data(vis.hosts);

    let gridlineYEnter = gridlineY.enter().append("line")
        .attr("class", "gridline gridline-y");

    gridlineYEnter.merge(gridlineY)
      .transition()
        .attr("y1", d => vis.yScale(d) + vis.config.cellWidth)
        .attr("x1", 0)
        .attr("y2", d => vis.yScale(d) + vis.config.cellWidth)
        .attr("x2", vis.config.matrixWidth);

    gridlineY.exit().remove();
  }
}

class BarChart {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      x: _config.x,
      y: _config.y,
      barHeight: 30,
      maxHeight: 300
    }
    
    this.config.margin = _config.margin || { top: 30, bottom: 10, right: 15, left: 60 };
    
    this.initVis();
  }
  
  initVis() {
    let vis = this;
    
    vis.svgContainer = d3.select(vis.config.parentElement).append("svg");
    
    vis.svg = vis.svgContainer.append("g")
        .attr("transform", "translate(" + vis.config.margin.left + "," + vis.config.margin.top + ")");

    vis.focus = vis.svg.append("g");

    // Initialize scales and axes
    vis.xScale = d3.scaleLinear();
    vis.yScale = d3.scaleBand();

    vis.xAxis = d3.axisTop(vis.xScale)
        .tickPadding(8)
        .ticks(4);
    vis.yAxis = d3.axisLeft(vis.yScale);

    vis.xAxisGroup = vis.focus.append("g")
        .attr("class", "axis axis--x hide-path ticks-medium");

    vis.yAxisGroup = vis.focus.append("g")
        .attr("class", "axis axis--y hide-path");
  }
  
  wrangleDataAndUpdateScales() {
    let vis = this;  
    
    let yDomain = d3.map(vis.data, d => d[vis.config.y]).keys();

    // Update container size
    vis.config.containerWidth = $(vis.config.parentElement).width();
    vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    
    // Dynamic bar chart height
    if(vis.config.barHeight * yDomain.length > vis.config.maxHeight) {
      vis.config.barHeight = vis.config.maxHeight / yDomain.length;
      vis.config.height = vis.config.maxHeight;
    } else {
      vis.config.height = vis.config.barHeight * yDomain.length;
    }

    vis.config.containerHeight = vis.config.height + vis.config.margin.top + vis.config.margin.bottom;

    vis.svgContainer
        .attr("width", vis.config.containerWidth)
        .attr("height", vis.config.containerHeight);

    // Update scales
    vis.xScale = vis.xScale
        .domain([0, d3.max(vis.data, d => d[vis.config.x])])
        .range([0, vis.config.width]);

    vis.yScale = vis.yScale
        .domain(yDomain)
        .range([0, vis.config.height]);

    vis.xAxis.tickSize(-vis.config.height);
    
    vis.updateVis();
  }
  
  updateVis() {
    let vis = this;

    // Draw bars
    let bar = vis.focus.selectAll(".bar")
        .data(vis.data);

    let barEnter = bar.enter().append("rect")
        .attr("class", "bar fill-default");
    
    barEnter.merge(bar)
      .transition()
        .attr("y", d => vis.yScale(d[vis.config.y]))
        .attr("width", d => vis.xScale(d[vis.config.x]))
        .attr("height", vis.config.barHeight-1);
    
    bar.exit().remove();

    // Draw axes and grid lines
    vis.yAxisGroup.call(vis.yAxis);
    vis.xAxisGroup.call(vis.xAxis);
  }
}

class DirectedAcyclicGraph {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      maxHostWidth: 80,
      //maxCellHeight: 25,
      maxWidth: 600,
      maxDelta: 100
    }
    
    this.config.margin = _config.margin || { top: 80, bottom: 20, right: 0, left: 10 };
    
    this.initVis();
  }
  
  initVis() {
    let vis = this;
    
    vis.svgContainer = d3.select(vis.config.parentElement).append("svg");
    
    vis.svg = vis.svgContainer.append("g")
        .attr("transform", "translate(" + vis.config.margin.left + "," + vis.config.margin.top + ")");

    vis.focus = vis.svg.append("g");

    vis.yScale = d3.scaleLinear();

    vis.xScale = d3.scaleBand();
    vis.xAxis = d3.axisTop(vis.xScale);
    vis.xAxisGroup = vis.focus.append("g")
        .attr("class", "axis axis--x hide-path");
  }
  
  wrangleDataAndUpdateScales() {
    let vis = this;

    vis.hosts = d3.map(vis.nodes, d => d.host).keys();
   
    if((vis.hosts.length * vis.config.maxHostWidth) < vis.config.maxWidth) {
      vis.config.width = vis.hosts.length * vis.config.maxHostWidth;
    } else {
      vis.config.width = vis.config.maxWidth;
    }

    // Update container size
    vis.config.containerWidth = vis.config.width + vis.config.margin.left + vis.config.margin.right;
    vis.config.containerHeight = $(vis.config.parentElement).height() - app.offsetTop;
    vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    
    vis.svgContainer
        .attr("width", vis.config.containerWidth)
        .attr("height", vis.config.containerHeight);

    const yPosExtent = d3.extent(vis.nodes, d => d.pos); // Extent of vertical positions
    if((vis.config.height / (yPosExtent[1]-yPosExtent[0])) > vis.config.maxDelta) {
      vis.config.height = (yPosExtent[1]-yPosExtent[0]) * vis.config.maxDelta;
    }

    vis.yScale
        .domain(yPosExtent)
        .range([0, vis.config.height]);

    vis.xScale
        .domain(vis.hosts)
        .range([0, vis.config.width]);

    const maxPos = d3.max(vis.nodes, d => d.pos);
    vis.config.delta = Math.min(vis.config.maxDelta, vis.config.height / maxPos);
    vis.config.hostWidth = vis.xScale.bandwidth();
   
    vis.updateVis();
  }
  
  updateVis() {
    let vis = this;

    // Update axis
    vis.xAxisGroup.call(vis.xAxis)
      .selectAll("text")
        .attr("text-anchor", "end")
        .attr("dx", ".15em")
        .attr("dy", ".25em")
        .attr("transform", "translate(-10,-10) rotate(90)");

    // Vertical lines
    let hostLine = vis.focus.selectAll(".gridline")
      .data(vis.hosts);

    let hostLineEnter = hostLine.enter().append("line")
        .attr("class", "gridline")
    
    hostLineEnter.merge(hostLine)
      .transition()
        .attr("x1", d => vis.xScale(d) + vis.config.hostWidth/2)
        .attr("x2", d => vis.xScale(d) + vis.config.hostWidth/2)
        .attr("y2", vis.config.height);
    
    hostLine.exit().remove();

    // Draw connection
    let connection = vis.focus.selectAll(".connection")
      .data(vis.edges, d => {
        return d.id;
      });

    let connectionEnter = connection.enter().append("line")
        .attr("class", "connection")
    
    connectionEnter.merge(connection)
      .transition()
        .attr("x1", d => vis.xScale(d.host) + vis.config.hostWidth/2)
        .attr("y1", d => vis.yScale(d.pos))
        .attr("x2", d => vis.xScale(d.happenedBefore.event.host) + vis.config.hostWidth/2)
        .attr("y2", d => vis.yScale(d.happenedBefore.event.pos));
    
    connection.exit().remove();


    // Draw nodes
    let node = vis.focus.selectAll(".node")
      .data(vis.nodes, d => {
        return d.id;
      });

    let nodeEnter = node.enter().append("circle")
        .attr("class", "node fill-default")
    
    nodeEnter.merge(node)
      .transition()
        .attr("cx", d => vis.xScale(d.host) + vis.config.hostWidth/2)
        .attr("cy", d => vis.yScale(d.pos))
        .attr("r", 4);
    
    nodeEnter.on("mouseover", d => {
          console.log(d);
        });
    
    node.exit().remove();
  }
}

class TemporalHeatmap {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      maxCellWidth: 25,
      maxCellHeight: 25,
      maxWidth: 300
    }
    
    this.config.margin = _config.margin || { top: 80, bottom: 20, right: 0, left: 10 };
    
    this.initVis();
  }
  
  initVis() {
    let vis = this;
    
    vis.svgContainer = d3.select(vis.config.parentElement).append("svg");
    
    vis.svg = vis.svgContainer.append("g")
        .attr("transform", "translate(" + vis.config.margin.left + "," + vis.config.margin.top + ")");

    vis.focus = vis.svg.append("g");

    vis.xScale = d3.scaleBand();
    vis.xAxis = d3.axisTop(vis.xScale);
    vis.xAxisGroup = vis.focus.append("g")
        .attr("class", "axis axis--x");
  }
  
  wrangleDataAndUpdateScales() {
    let vis = this;  
    
    vis.hosts = d3.map(vis.data, d => d.host).keys();

    // Compute grid size
    vis.config.nCols = vis.hosts.length;
    //vis.config.nRows = d3.max(vis.data, d => d.vectorTimestamp.ownTime); 
    vis.config.nRows = vis.data.length; 
    
    if((vis.config.nCols * vis.config.maxCellWidth) < vis.config.maxWidth) {
      vis.config.width = vis.config.nCols * vis.config.maxCellWidth;
    } else {
      vis.config.width = vis.config.maxWidth;
    }

    // Update container size
    vis.config.containerWidth = vis.config.width + vis.config.margin.left + vis.config.margin.right;
    vis.config.containerHeight = $(vis.config.parentElement).height() - app.offsetTop;
    vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    
    vis.svgContainer
        .attr("width", vis.config.containerWidth)
        .attr("height", vis.config.containerHeight);

    vis.xScale = vis.xScale
        .domain(vis.hosts)
        .range([0, vis.config.width]);

    vis.config.cellHeight = Math.min(vis.config.maxCellHeight, vis.config.height / vis.config.nRows);
    vis.config.cellWidth = vis.xScale.bandwidth();
    
    vis.updateVis();
  }
  
  updateVis() {
    let vis = this;

    // Update axis
    vis.xAxisGroup.call(vis.xAxis)
      .selectAll("text")
        .attr("text-anchor", "end")
        .attr("dx", ".15em")
        .attr("dy", ".25em")
        .attr("transform", "translate(-10,-10) rotate(90)");

    // Draw heatmap
    let cell = vis.focus.selectAll(".cell")
      .data(vis.data, d => {
        return d.id;
      });

    let cellEnter = cell.enter().append("rect")
        .attr("class", "cell fill-default")
    
    cellEnter.merge(cell)
      .transition()
        .attr("x", d => vis.xScale(d.host))
        //.attr("y", d => (d.vectorTimestamp.ownTime-1) * vis.config.cellHeight)
        .attr("y", (d,index) => index * vis.config.cellHeight)
        .attr("width", vis.config.cellWidth)
        .attr("height", Math.max(1, vis.config.cellHeight-1));
    
    cell.exit().remove();
  }
}

class Timeline {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      eventHandler: _config.eventHandler,
      nBins: 30,
    }
    
    this.config.margin = _config.margin || { top: 20, bottom: 20, right: 12, left: 20 };
    
    this.initVis();
  }
  
  initVis() {
    let vis = this;
    
    vis.svgContainer = d3.select(vis.config.parentElement).append("svg");
    
    vis.svg = vis.svgContainer.append("g")
        .attr("transform", "translate(" + vis.config.margin.left + "," + vis.config.margin.top + ")");

    vis.focus = vis.svg.append("g");

    vis.xScale = d3.scaleLinear();
    vis.yScale = d3.scaleLinear();

    vis.xAxis = d3.axisTop(vis.xScale)
        .tickPadding(8)
        .ticks(4);

    vis.xAxisGroup = vis.focus.append("g")
        .attr("class", "axis axis--x hide-path hide-labels ticks-light");
    
    vis.timelineRect = vis.focus.append("rect")
        .attr("class", "timeline-rect fill-light")
        .attr("opacity", 0);

    // Brush
    vis.svgContainer.append("g")
        .attr("transform", "translate(" + vis.config.margin.left + "," + vis.config.margin.top + ")")
        .attr("class", "brush");

    vis.brush = d3.brushY()
        .on("end", brushed);

    function brushed() {
      let s = d3.event.selection;
      let selectedRangeSnapped = [];

      if(s) {
        let selectedRange = s.map(vis.yScale.invert, vis.yScale);
        selectedRangeSnapped = selectedRange.map(d => Math.round(d));
      }

      app.filter.time = selectedRangeSnapped;
      $(vis.config.eventHandler).trigger("selectionChanged");
    }

    // Add label
    vis.svgContainer.append("text")
        .attr("class", "timeline-label")
        .attr("transform", d => "translate(16, 20), rotate(-90)")
        .attr("text-anchor", "end")
        .text("← TIME");
  }
  
  wrangleDataAndUpdateScales() {
    let vis = this;

    // Update container size
    vis.config.containerWidth = $(vis.config.parentElement).width();
    vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    
    vis.config.containerHeight = $(vis.config.parentElement).height() - app.offsetTop;
    vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    
    vis.svgContainer
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    vis.brush.extent([[0, 0], [vis.config.width, vis.config.height]]);

    vis.yScale
        .domain(d3.extent(vis.data, d => d.fields.time_numeric))
        .range([0, vis.config.height]);

    if(app.temporalOrder == "physical") {
      // Set parameters for histogram
      vis.histogram = d3.histogram()
          .value(d => d.fields.time_numeric)
          .domain(vis.yScale.domain())
          .thresholds(vis.yScale.ticks(vis.config.nBins));

      // Generate bins
      vis.bins = vis.histogram(vis.data);

      vis.xScale
          .domain([0, d3.max(vis.bins, d => d.length)])
          .range([0, vis.config.width]);

      vis.xAxis.tickSize(-vis.config.height);
    } else {
      vis.timelineRect
          .attr("width", vis.config.width)
          .attr("height", vis.config.height);
    }

    vis.updateVis();
  }
  
  updateVis() {
    let vis = this;

    if(app.temporalOrder == "physical") {
      // Update axis
      vis.xAxisGroup.call(vis.xAxis);

      // Draw bars
      let bar = vis.focus.selectAll(".bar")
          .data(vis.bins);

      let barEnter = bar.enter().append("rect")
          .attr("class", "bar fill-light");
      
      barEnter.merge(bar)
        .transition()
          .attr("y", d => vis.yScale(d.x0))
          .attr("width", d => vis.xScale(d.length))
          .attr("height",d => vis.yScale(d.x1) - vis.yScale(d.x0));
      
      bar.exit().remove();

      vis.timelineRect.attr("opacity", 0);
    } else {
      vis.focus.selectAll(".bar").remove();
      vis.timelineRect.attr("opacity", 1);
    }

    // Update brush
    vis.svgContainer.select(".brush")
        .call(vis.brush);
  }
}

/**
 * Constructs an Exception object that has the message specified.
 * 
 * @classdesc
 * 
 * Exceptions represent unexpected errors or circumstances that may be caught.
 * In Shiviz, you should ONLY ever throw Exception objects (as opposed to say,
 * raw strings). Exceptions contain a message that can be retrieved in HTML form
 * or as a raw string. The message can be either user-friendly or
 * non-user-friendly. A user-friendly message is one that would make sense to a
 * reasonable end-user who has no knowledge of Shiviz's internal workings.
 * 
 * @constructor
 * @param {String} message The message
 * @param {Boolean} isUserFriendly if true, this message is user-friendly
 */
function Exception(message, isUserFriendly) {

    /** @private */
    this.rawString = "";

    /** @private */
    this.htmlString = "";

    /** @private */
    this._isUserFriendly = !!isUserFriendly;

    if (message) {
        this.append(message);
    }
}

/**
 * Sets whether or not the message contained in this object is user-friendly. A
 * user-friendly message is one that would make sense to a reasonable end-user
 * who has no knowledge of Shiviz's internal workings.
 * 
 * @param {Boolean} val true if this should be set to user-friendly
 */
Exception.prototype.setUserFriendly = function(val) {
    this._isUserFriendly = val;
};

/**
 * Returns true if the message contained in this object is user-friendly. A
 * user-friendly message is one that would make sense to a reasonable end-user
 * who has knowledge of Shiviz's internal workings.
 * 
 * @returns {Boolean} true if user friendly
 */
Exception.prototype.isUserFriendly = function() {
    return this._isUserFriendly;
};

/**
 * Appends text to the message contained in this object. The new text will be
 * added after existing text
 * 
 * @param {String} string The message text to append
 * @param {?String} [style] The text style. Should be one of 'bold', 'italic',
 *            or 'code'. This parameter should be omitted or set to null if
 *            normal, unstyled text is desired
 */
Exception.prototype.append = function(string, style) {
    this.rawString += string;
    this.htmlString += this.getHTML(string, style);
};

/**
 * Prepends text to the message contained in this object. The new text will be
 * added before existing text
 * 
 * @param {String} string The message text to prepend
 * @param {String} style The text style. Should be one of 'bold', 'italic', or
 *            'code'. This parameter should be omitted if normal, unstyled text
 *            is desired
 */
Exception.prototype.prepend = function(string, style) {
    this.rawString = string + this.rawString;
    this.htmlString = this.getHTML(string, style) + this.htmlString;
};

/**
 * Gets the message contained as a raw string. The raw string ignored any text
 * style specified when appending or prepending text
 * 
 * @returns {String} the exception message
 */
Exception.prototype.getMessage = function() {
    return this.rawString;
};

/**
 * Gets the message as HTML. This will be an escaped piece of HTML code that can
 * be inserted into say, a div
 * 
 * @returns {String} the exception message
 */
Exception.prototype.getHTMLMessage = function() {
    return this.htmlString;
};

/**
 * @private
 * @param string
 * @param style
 */
Exception.prototype.getHTML = function(string, style) {
    string = string.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
    if (!style) {
        return string;
    }
    if (style == 'bold') {
        return "<strong>" + string + "</strong>";
    }
    if (style == "italic") {
        return "<em>" + string + "</em>";
    }
    if (style == "code") {
        return "<pre>" + string + "</pre>";
    }

    throw new Exception("Exception.prototype.getHTML: Invalid style argument.");
};

/**
 * Constructs a NamedRegExp object
 * 
 * @clasdesc
 * 
 * A RegExp extension that allows named capture groups in the syntax /(?<name>regexp)/
 * 
 * @constructor
 * @param {String} regexp a string describing a regular expression. All
 *            backslashes must be escaped, e.g. \\d
 * @param {?String} [flags=""] a string of regexp flags, e.g. "mi" for multiline
 *            case-insensitive
 */
function NamedRegExp(regexp, flags) {
    var match, names = [];
    flags = flags || "";

    try {
        this.no = new RegExp(regexp.replace(/\(\?<\w+?>/g, "\(\?\:"), "g" + flags);

        regexp = regexp.replace(/\((?!\?(=|!|<|:))/g, "(?:");
        while (match = regexp.match(/\(\?<(\w+?)>.+\)/)) {
            if (names.indexOf(match[1]) > -1) {
                var exc = new Exception("The regular expression you entered was invalid.\n", true);
                exc.append("There are multiple capture groups named " + match[1]);
                throw exc;
            }
            else {
                names.push(match[1]);
            }

            regexp = regexp.replace(/\(\?<\w+?>/, '\(');
        }

        this.reg = new RegExp(regexp, "g" + flags);
    }
    catch (e) {
        if (e instanceof Exception)
            throw e;

        var exception = new Exception("The following regular expression entered was invalid.\n", true);
        exception.append(regexp, "code");
        exception.append("The error given by the browser is: \n");
        exception.append(e.message.replace(/(?:.*\/\:\s+)?(.*)/, "$1"), "code");
        throw exception;
    }

    /** @private */
    this.names = names;
}

/**
 * <p>
 * Extension of RegExp.exec() Returns an extended array - first array element is
 * matching string, and elements thereafter are captured strings from regular
 * (non-named) groups. Named captures are extend upon arrays, e.g. for a name of
 * "date" the array will contain a property "date" with the captured string.
 * </p>
 * 
 * <p>
 * Multiple matches behave like RegExp.exec(), where each iteration of the call
 * produces the next match, or null if there are no more matches.
 * </p>
 * 
 * <p>
 * If there is no match for the regular expression, null is returned.
 * </p>
 * 
 * @param {String} string test string
 * @returns {Array<String>} array of match & captured matches, extended with
 *          named capture groups as object properties. See documentation for
 *          js's
 *          {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
 *          built in regex} for more information
 */
NamedRegExp.prototype.exec = function(string) {
    var num = this.no.exec(string);
    var nam = this.reg.exec(string);

    if (nam && nam.length > 1)
        for (var i = 1; i < nam.length; i++) {
            num[this.names[i - 1]] = nam[i];
        }

    return num;
};

/**
 * Tests for a match, just like RegExp.test()
 * 
 * @param {String} string test string
 * @returns {Boolean} whether a match was found or not
 */
NamedRegExp.prototype.test = function(string) {
    return this.no.test(string);
};

/**
 * Gets array of capture group labels
 * 
 * @returns {Array<String>} Capture group labels
 */
NamedRegExp.prototype.getNames = function() {
    return this.names;
};
/**
 * Util is not an instantiable class. Do not call this constructor
 * 
 * @classdesc
 * 
 * Util is a utility class containing methods commonly used throughout Shiviz.
 * Util is not instantiable and only contains public static methods. No method
 * in Util is allowed to modify any sort of global state.
 * 
 * @constructor
 */
function Util() {
    throw new Exception("Util is not instantiable");
}

/**
 * Creates a shallow copy of a raw object
 * 
 * @static
 * @param {Object} obj the object to clone
 * @returns {Object} the clone
 */
Util.objectShallowCopy = function(obj) {
    var result = {};
    for (var key in obj) {
        result[key] = obj[key];
    }
    return result;
};

Util.arrayToObject = function(array, idFn) {
    var result = {};
    for(var i = 0; i < array.length; i++) {
        if(idFn) {
            result[idFn(array[i])] = array[i];
        }
        else {
            result[array[i]] = array[i];
        }
    }
};

Util.objectUnion = function() {
    var result = {};
    
    for(var i = 0; i < arguments.length; i++) {
        var obj = arguments[i];
        for(var key in obj) {
            result[key] = obj[key];
        }
    }

    return result;
};


Util.objectIntersection = function() {
    var result = Util.objectUnion.apply(this, arguments);
    
    for(var key in result) {
        for(var i = 0; i < arguments.length; i++) {
            if(arguments[i][key] == undefined) {
                delete result[key];
            }
        }
    }
    
    return result;
};

/**
 * Removes elements from an array
 * 
 * @param  {Array} arr The array
 * @param  {Function|any} arg A function that matches elements to be removed,
 *             or the element to be removed
 */
Util.removeFromArray = function(arr, arg) {
    if (arg.constructor == Function) {
        var f;
        while (f = arr.filter(arg)[0])
            arr.splice(arr.indexOf(f), 1);
    } else {
    	arr.splice(arr.indexOf(arg), 1);
    }
};

/**
 * Creates an SVG element with the proper namespace, and returns
 * a jQuery reference to the new element
 * 
 * @param  {String} tag The tag name for the element to create
 * @return {jQuery.selection} A jQuery selection instance of the element
 */
Util.svgElement = function(tag) {
    return $(document.createElementNS("http://www.w3.org/2000/svg", tag));
};

/**
 * Produce a new string that is the reverse of the given string.
 *
 * @param  {String} string to be reversed
 * @return {String} reverse of input string 
 */
Util.reverseString = function(string) {
    var stringArray = string.split("");
    stringArray.reverse();
    var reversedString = stringArray.join("");
    return reversedString;
}


// Webserver path 
//const path = "/ubc/ds/dsvis/";
const path = "";

let examplesData;
let selectedExample;

// Helper class to get happened-before relationships and node positions for DAG.
let graph;

// All events
let logEvents;

// Events and connections in selected time window
let filteredLogEvents; 
let filteredConnections; 

// Event handler for temporal selections
let OverviewEventHandler = {};

// Search parameters (fuse.js library)
let fuse;
const fuseSearchOptions = {
  tokenize: true,
  matchAllTokens: true,
  threshold: 0.1,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: [
    "text",
    "host",
    "fields.action"
  ]
};

// Overview vis
let timeline = new Timeline({ parentElement: "#timeline", eventHandler: OverviewEventHandler });

// Selection vis
let temporalHeatmap = new TemporalHeatmap({ parentElement: "#temporal-heatmap" });
let adjacencyMatrix = new AdjacencyMatrix({ parentElement: "#adjacency-matrix" });
let dag = new DirectedAcyclicGraph({ parentElement: "#dag" });
let hostDistributionChart = new BarChart({ parentElement: "#host-distribution .bar-chart", y:"key", x:"value" });
let actionDistributionChart = new BarChart({ parentElement: "#action-distribution .bar-chart", y:"key", x:"value" });

let app = {
  offsetTop: 45,
  filter: {
    time: [],
    tags: []
  }
}

const views = [
  timeline,
  temporalHeatmap,
  adjacencyMatrix,
  hostDistributionChart,
  actionDistributionChart
];

let testData = {
  "nodes":[
    {"name":"node0"},
    {"name":"node1"},
    {"name":"node2"},
    {"name":"node3"}
  ],
  "links":[
    {"source":"node0","target":"node0","value":5},
    {"source":"node0","target":"node1","value":8},
    {"source":"node0","target":"node2","value":2},
    {"source":"node1","target":"node1","value":18},
    {"source":"node1","target":"node2","value":1},
    {"source":"node3","target":"node3","value":4}
  ]
};


loadExamples();

// Load meta-data for all examples
function loadExamples() {
  d3.json(path + "data/examples_config.json")
      .then(function(data) {
        examplesData = data;
        examplesData.forEach(d => {
          $("#examples-list").append('<li data-log="'+ d.filename +'">'+ d.title +'</li>');
        });
      })
      .catch(function(error) {
        console.log(error); 
      });
}

// Load log data for one example
function selectExample(filename) {
  selectedExample = examplesData.find(d=>d.filename==filename);

  d3.text(path + "data/log/" + selectedExample.filename).then(data => {
    $("#log-input").val(data);
  });

  $("#parser-input").val(selectedExample.parser);
}

// Use shiviz parser to process raw log data into JavaScript object
function parseData() {
  let log = $("#log-input").val();
  let regexpString = $("#parser-input").val();

  let delimiterString = "";
  let delimiter = delimiterString == "" ? null : new NamedRegExp(delimiterString, "m");
  regexpString = regexpString.trim();

  let regexp = new NamedRegExp(regexpString, "m");
  let parser = new LogParser(log, delimiter, regexp);
  
  // Switch tab and show visualization
  UIkit.switcher("#primary-nav .uk-nav").show(1);
  
  // User parser from shiviz
  var labelGraph = {};
  var labels = parser.getLabels();
  parsedLogEvents = parser.getLogEvents("");

  // Check if physical timestamps are given
  app.temporalOrder = (parsedLogEvents[0].fields.date) ? "physical" : "logical";

  graph = new ModelGraph({}, parsedLogEvents);
  logEvents = graph.getNodes();
  
  // Initialize search
  fuse = new Fuse(logEvents, fuseSearchOptions);

  filteredLogEvents = logEvents;
  filteredConnections = graph.getEdges();
  showNumberOfResults();
  updateViews();
};

function filterData() {
  filteredLogEvents = logEvents;
  if(app.filter.tags.length > 0) {
    filteredLogEvents = fuse.search(app.filter.tags.join(" "));
  }
  if(app.filter.time.length > 0) {
    filteredLogEvents = filteredLogEvents.filter(d => {
      return d.fields.time_numeric > app.filter.time[0] && d.fields.time_numeric < app.filter.time[1];
    });
  }
  if(filteredLogEvents.length != logEvents.length) {
    filteredConnections = graph.getFilteredEdges(filteredLogEvents);
  } else {
    filteredConnections = graph.getEdges();
  }

  showNumberOfResults();
  updateSelectionViews();
}


function showNumberOfResults() {
  if(filteredLogEvents.length == logEvents.length) {
    $("#number-of-events").html(logEvents.length + " results");
  } else {
    $("#number-of-events").html("<strong>" + filteredLogEvents.length + " results</strong> (of " + logEvents.length + ")");
  }
}

function updateViews() {
  timeline.data = logEvents;
  timeline.wrangleDataAndUpdateScales();

  updateSelectionViews();
}


function updateSelectionViews() {
  // Draw vis
  temporalHeatmap.data = filteredLogEvents;
  temporalHeatmap.wrangleDataAndUpdateScales();

  adjacencyMatrix.data = filteredLogEvents;
  adjacencyMatrix.wrangleDataAndUpdateScales();

  dag.nodes = filteredLogEvents;
  dag.edges = filteredConnections;
  dag.wrangleDataAndUpdateScales();

  // Count events per host
  let eventsPerHost = d3.nest()
      .key(d => d.host)
      .rollup(v => v.length)
      .entries(filteredLogEvents);

  hostDistributionChart.data = eventsPerHost;
  hostDistributionChart.wrangleDataAndUpdateScales();

  // Count events per action
  if(filteredLogEvents.length > 0 && filteredLogEvents[0].fields.action) {
    $("#action-distribution").fadeIn();
    let eventsPerActionType = d3.nest()
        .key(d => d.fields.action)
        .rollup(v => v.length)
        .entries(filteredLogEvents)
        .sort((a,b) => d3.descending(a.value, b.value));

    actionDistributionChart.data = eventsPerActionType;
    actionDistributionChart.wrangleDataAndUpdateScales();
  } else {
    $("#action-distribution").hide();
  }
}

// Redraw all views (e.g, after window resize)
function redrawViews() {
  views.forEach(view => {
    view.wrangleDataAndUpdateScales();
  });
}

// HELPER FUNCTIONS (ONLY TEST; to be decided)
function getDiff(c1, c2) {
  let d = [];
  for (let x in c1) {
      if (!(x in c2) || c1[x] != c2[x]) {
          d.push(x);
      }
  }
  for (let x in c2) {
      if (!(x in c1)) {
          d.push(x);
      }
  }
  return d;
}


// https://github.com/mixu/vectorclock/blob/master/index.js
function compareVT(a, b) {
  var isGreater = false,
      isLess = false;

  // allow this function to be called with objects that contain clocks, or the clocks themselves
  if(a.clock) a = a.clock;
  if(b.clock) b = b.clock;

  allKeys(a, b).forEach(function(key) {
    var diff = (a[key] || 0) - (b[key] || 0);
    if(diff > 0) isGreater = true;
    if(diff < 0) isLess = true;
  });

  if(isGreater && isLess) return 0;
  if(isLess) return -1;
  if(isGreater) return 1;
  return 0; // neither is set, so equal
}

function allKeys(a, b){
  var last = null;
  return Object.keys(a)
    .concat(Object.keys(b))
    .sort()
    .filter(function(item) {
      // to make a set of sorted keys unique, just check that consecutive keys are different
      var isDuplicate = (item == last);
      last = item;
      return !isDuplicate;
    });
}


/*
 * Search
 */

let searchSelect = $("#search-input").select2({
  width: "resolve",
  //minimumResultsForSearch: 6,
  dropdownParent: $("#search-input-container"),
  placeholder: "Search ...",
  multiple: true,
  tags: true,
  tokenSeparators: [',', ' '],
  allowClear: true
});

searchSelect.on("change", function() {
  app.filter.tags = $(this).val();
  filterData();
});


/*
 * Event listeners
 */

// Window resize
$(window).resize(function() {
  if(this.resizeTO) clearTimeout(this.resizeTO);
  this.resizeTO = setTimeout(function() {
    $(this).trigger('resizeEnd');
  }, 500);
});

$(window).bind("resizeEnd", function() {
  // Check if visualizations are active
  if($("#main li.uk-active").attr("data-tab") == "vis") {
    redrawViews();
  }
});

// User changed the selected time window 
$(OverviewEventHandler).bind("selectionChanged", function() {
  filterData();
});

// Click on example log
$("ul#examples-list").on("click", "li", function(){
  selectExample($(this).attr("data-log"));
});

// Switch tab and visualize results
$("#visualize").on("click", function() {
  $("#vis-tab").removeClass("uk-hidden");
  parseData();
});


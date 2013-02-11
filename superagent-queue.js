
/**
 * Module dependencies.
 */

var superagent = require('superagent');

/**
 * Module exports.
 */

module.exports = extend;

/**
 * Installs the `queue` extension to superagent.
 *
 * @param {Object} superagent module
 * @api public
 */

function extend(sa){
  var Request = sa.Request;

  /**
   * Queues.
   */

  var queues = {};
  var running = {};

  /**
   * `queue` method.
   *
   * @param {String} name of the queue
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.queue = function(name){
    this.queueName = name;
    return this;
  };

  /**
   * Reference to original functions.
   */

  var oldEnd = Request.prototype.end;
  // the node version does not support abort() yet:
  // see https://github.com/visionmedia/superagent/issues/157
  var oldAbort = Request.prototype.abort || function () { return this; };

  /**
   * Checks for queued requests.
   *
   * @api private
   */

  function unqueue(name){
    var item = queues[name].shift();

    if (!item) {
      delete queues[name];
      return;
    }

    var obj = item[0];
    var fn = item[1];

    // immutable .length hack :\
    if (!fn) {
      oldEnd.call(obj, function(){
        unqueue(name);
      });
    } else if (fn.length == 1) {
      oldEnd.call(obj, function(res){
        fn && fn(res);
        unqueue(name);
      });
    } else {
      oldEnd.call(obj, function(err, res){
        fn && fn(err, res);
        unqueue(name);
      });
    }
  }

  /**
   * Overrides `end` method to defer calls.
   *
   * @api private
   */

  Request.prototype.end = function(fn){
    var queue = this.queueName;

    if (queue) {
      if (!queues[queue]) {
        queues[queue] = [[this, fn]];
        unqueue(queue);
      } else {
        queues[queue].push([this, fn]);
      }
    } else {
      oldEnd.call(this, fn);
    }
    return this;
  };

  /**
   * Overrides `abort` method to remove the request from the queue.
   *
   * @api private
   */

  Request.prototype.abort = function(){
    var queue = this.queueName;

    if (!queue || !queues[queue])
      return oldAbort.call(this);

    for (var index = queues[queue].length - 1; index >= 0; index--) {
      var item = queues[queue][index];
      if (item[0] == this)
        break;
    }
    if (~index) { // still in queue, just remove it
      queues[queue].splice(index, 1);
    } else {
      oldAbort.call(this);
      unqueue(queue);
    }
    return this;
  };
};

/**
 * Extends the built-in dependency.
 */

extend(superagent);

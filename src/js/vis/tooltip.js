class Tooltip {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement, 
    }
    this.formatTime = d3.timeFormat("%Y-%m-%d %H:%M:%S.%L");
  }

  showEvent(event, coordinates) {
    let content = '<div class="tooltip-message">'+ event.text +'</div>';
    content += '<table class="tooltip-table">';
    content += '<tr><th>Host:</th><td class="value">'+ event.host +'</td></tr>';
    if(event.fields.timestamp) {
      content += '<tr><th>Date:</th><td class="value">'+ this.formatTime(event.fields.timestamp) +'</td></tr>';
    }
    if(event.fields.action) {
      content += '<tr><th>Action:</th><td class="value">'+ event.fields.action +'</td></tr>';
    }
    this.showTooltip(content, coordinates);
  }

  showValue(value, coordinates) {
    let content = '<div class="tooltip-info">'+ value +'</div>';
    this.showTooltip(content, coordinates);
  }

  hide() {
    $(this.config.parentElement).hide();
  }
  
  showTooltip(content, coordinates) {
    $(this.config.parentElement)
      .css({ top: coordinates.y + 10, left: coordinates.x + 15, display:'block' })
      .html(content);
  }
}
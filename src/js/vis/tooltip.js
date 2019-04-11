class Tooltip {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement, 
    }
  }

  showEvent(event, coordinates) {
    let content = '<div>'+ event.text +'</div>';
    this.showTooltip(content, coordinates);
  }

  hide() {
    $(this.config.parentElement).hide();
  }
  
  showTooltip(content, coordinates) {
    $(this.config.parentElement)
      .css({ top: coordinates.y + 20, left: coordinates.x + 20, display:'block' })
      .html(content);
  }
}
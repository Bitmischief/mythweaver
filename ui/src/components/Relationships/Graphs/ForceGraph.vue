<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import * as d3 from 'd3';
import svgPanZoom from 'svg-pan-zoom';
import {
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  PlusIcon,
  MinusIcon,
  ArrowUpOnSquareIcon,
} from '@heroicons/vue/20/solid';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps<{
  data: {
    nodes: any[];
    links: any[];
  };
}>();

const route = useRoute();
const router = useRouter();
const fullScreen = ref(false);

const graph = ref();
const simulation = ref();

const nodeGroup = ref();
const linkGroup = ref();
const bgEls = ref();
const imgEls = ref();
const textEls = ref();
const linkEls = ref();
const linkTextEls = ref();
const markerEls = ref();

const svgWidth = ref(500);
const svgHeight = ref(1000);

const padding = 10;
const maxWidth = 200;
const imageHeight = 50;

const viewBoxWidth = ref(1000);
const viewBoxHeight = ref(500);

const panZoom = ref();
const selectedNode = ref();

onMounted(async () => {
  svgWidth.value = document.getElementById('svg-wrapper')?.offsetWidth || 0;
  svgHeight.value = document.getElementById('svg-wrapper')?.offsetHeight || 0;

  viewBoxWidth.value = svgWidth.value * 1.5;
  viewBoxHeight.value = svgHeight.value * 1.5;

  graph.value = d3
    .select('#force-graph')
    .select('#svg-wrapper')
    .append('svg')
    .attr('id', '#svg')
    .attr('height', '100%')
    .attr('width', '100%')
    .attr('viewBox', `0 0 ${viewBoxWidth.value} ${viewBoxHeight.value}`);

  createMarkers();

  simulation.value = d3
    .forceSimulation()
    .force(
      'link',
      d3
        .forceLink()
        .id((link: any) => link.id)
        .strength(0.25)
        .distance(500),
    )
    .force('collide', d3.forceCollide().radius(maxWidth / 1.5))
    .force('charge', d3.forceManyBody().strength(-1000))
    .force(
      'center',
      d3.forceCenter(viewBoxWidth.value / 2, viewBoxHeight.value / 2),
    );

  linkGroup.value = graph.value
    .append('g')
    .attr('fill', 'none')
    .attr('stroke-width', 1.5)
    .selectAll('g')
    .data(props.data.links)
    .enter()
    .append('g');

  linkEls.value = linkGroup.value
    .append('path')
    .attr('stroke', 'grey')
    .attr('id', (link: any) => `${link.source}_${link.target}`);

  linkTextEls.value = linkGroup.value
    .append('text')
    .append('textPath')
    .text((link: any) => link.label)
    .attr('href', (link: any) => `#${link.source}_${link.target}`)
    .attr('text-anchor', 'middle')
    .attr('startOffset', '50%')
    .attr('fill', 'white');

  nodeGroup.value = graph.value
    .append('g')
    .selectAll('g')
    .data(props.data.nodes)
    .enter()
    .append('g')
    .on('click touchend', selectNode);

  bgEls.value = nodeGroup.value
    .append('rect')
    .attr('rx', 15)
    .attr('height', imageHeight + 2 * padding)
    .attr('width', maxWidth + 2 * padding)
    .style('fill', '#0f111b')
    .style('stroke', 'grey');

  imgEls.value = nodeGroup.value
    .append('image')
    .attr('height', imageHeight)
    .attr('xlink:href', (node: any) => node.imageUri);

  textEls.value = nodeGroup.value
    .append('text')
    .text((node: any) => node.name)
    .attr('dx', imageHeight + 2 * padding)
    .attr('dy', (imageHeight + 12 + 2 * padding) / 2)
    .style('font-size', '1em')
    .style('fill', 'white')
    .each(wrap);

  simulation.value.nodes(props.data.nodes).on('tick', tick);
  simulation.value.force('link').links(props.data.links);

  const svg = document.getElementById('#svg');
  if (svg) {
    panZoom.value = svgPanZoom(svg, {
      zoomEnabled: true,
      controlIconsEnabled: false,
      dblClickZoomEnabled: false,
      minZoom: 0.1,
    });
    document
      .getElementById('zoom-in')
      ?.addEventListener('click', zoomInListener);
    document
      .getElementById('zoom-out')
      ?.addEventListener('click', zoomOutListener);
  }

  if (route.query.source) {
    const source = parseInt(route.query.source as string);
    const node = props.data.nodes?.find((n: any) => n.id === source);
    if (node) {
      selectNode(null, node);
    }
  }
});

onUnmounted(() => {
  document
    .getElementById('zoom-in')
    ?.removeEventListener('click', zoomInListener);
  document
    .getElementById('zoom-out')
    ?.removeEventListener('click', zoomOutListener);
});

function zoomInListener(e: any) {
  e.preventDefault();
  panZoom.value.zoomIn();
}

function zoomOutListener(e: any) {
  e.preventDefault();
  panZoom.value.zoomOut();
}

const tick = () => {
  bgEls.value.attr('x', (node: any) => node.x).attr('y', (node: any) => node.y);
  imgEls.value
    .attr('x', (node: any) => node.x + padding)
    .attr('y', (node: any) => node.y + padding);
  textEls.value
    .attr('x', (node: any) => node.x)
    .attr('y', (node: any) => node.y);
  markerEls.value.attr('d', (link: any) => {
    if (link.source.x < link.target.x) {
      return 'M0,-5L10,0L0,5L0,-5';
    } else {
      return 'M10,-5L0,0L10,5L10,-5';
    }
  });
  linkEls.value
    .attr('d', linkArc)
    .attr('marker-end', (link: any) => {
      if (link.source.x < link.target.x) {
        return `url(#arrow-${link.source.id}_${link.target.id})`;
      }
    })
    .attr('marker-start', (link: any) => {
      if (link.source.x > link.target.x) {
        return `url(#arrow-${link.source.id}_${link.target.id})`;
      }
    });
};

function linkArc(d: any) {
  let width = (maxWidth + 2 * padding) / 2;
  let height = (imageHeight + 2 * padding) / 2;
  let x1 = d.source.x + width;
  let y1 = d.source.y + height;
  let x2 = d.target.x + width;
  let y2 = d.target.y + height;
  let dx = x2 - x1;
  let dy = y2 - y1;
  let p1 = getIntersection(dx, dy, x1, y1, width + padding, height + padding);
  let p2 = getIntersection(-dx, -dy, x2, y2, width + padding, height + padding);

  const r = Math.hypot(x2 - x1, y2 - y1) * 1.5;

  if (x1 < x2) {
    return `M${p1[0]},${p1[1]} A${r},${r} 0 0,0 ${p2[0]},${p2[1]}`;
  }
  return `M${p2[0]},${p2[1]} A${r},${r},0,0,1 ${p1[0]},${p1[1]}`;
}

function getIntersection(
  dx: number,
  dy: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (Math.abs(dy / dx) < h / w) {
    return [x + (dx > 0 ? w : -w), y + (dy * w) / Math.abs(dx)];
  } else {
    return [x + (dx * h) / Math.abs(dy), y + (dy > 0 ? h : -h)];
  }
}

function wrap() {
  // @ts-ignore
  let self = d3.select(this),
    textLength = self.node().getComputedTextLength(),
    text = self.text();
  while (textLength > maxWidth - imageHeight - padding && text.length > 0) {
    text = text.slice(0, -1);
    self.text(text + '...');
    textLength = self.node().getComputedTextLength();
  }
}

function getNodeOpacity(node: any, neighbors: any) {
  return neighbors.find((n: any) => n.id === node.id) ? 1 : 0.12;
}

function getLinkOpacity(node: any, link: any) {
  return link.target.id === node.id || link.source.id === node.id ? 1 : 0.12;
}

function getBgColor(node: any, neighbors: any) {
  if (node.id === selectedNode.value.id) {
    return '#d946ef';
  }
  if (neighbors.find((n: any) => n.id === node.id)) {
    return '#3b82f6';
  }
  return 'grey';
}

function getLinkColor(node: any, link: any) {
  if (node.id === 215 && link.source.id === 215) {
    console.log(node, link);
  }
  return link.target.id === node.id
    ? '#3b82f6'
    : link.source.id === node.id
      ? '#d946ef'
      : '#E5E5E5';
}

function getNeighbors(node: any, links: any) {
  return links.reduce(
    (neighbors: any, link: any) => {
      if (link.target.id === node.id) {
        neighbors.push({ id: link.source.id, type: 'incoming' });
      } else if (link.source.id === node.id) {
        neighbors.push({ id: link.target.id, type: 'outgoing' });
      }
      return neighbors;
    },
    [{ id: node.id, type: 'outgoing' }],
  );
}

// @ts-ignore
function selectNode(e: any, node: any) {
  console.log('selectNode');
  if (selectedNode.value && selectedNode.value.id === node.id) {
    selectedNode.value = null;
    nodeGroup.value.style('opacity', 1);
    linkGroup.value.style('opacity', 1);
    bgEls.value.style('stroke', 'grey');
    linkEls.value.attr('stroke', 'grey');
    markerEls.value.attr('fill', 'grey');
    return;
  }

  selectedNode.value = node;
  const neighbors = getNeighbors(node, props.data.links);

  bgEls.value.style('stroke', (n: any) => getBgColor(n, neighbors));
  linkEls.value.attr('stroke', (link: any) => getLinkColor(node, link));
  nodeGroup.value.style('opacity', (n: any) => getNodeOpacity(n, neighbors));
  linkGroup.value.style('opacity', (link: any) => getLinkOpacity(node, link));
  markerEls.value.attr('fill', (link: any) => getLinkColor(node, link));
}

function createMarkers() {
  markerEls.value = graph.value
    .append('defs')
    .selectAll('marker')
    .data(props.data.links)
    .join('marker')
    .attr('id', (link: any) => `arrow-${link.source}_${link.target}`)
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 5)
    .attr('markerWidth', 10)
    .attr('markerHeight', 10)
    .attr('orient', 'auto')
    .append('path')
    .attr('fill', 'grey');
}

const viewConjuration = () => {
  if (selectedNode.value) {
    router.push({
      path: `/conjurations/view/${selectedNode.value.id}`,
      query: { from: route.fullPath },
    });
  }
};
</script>

<template>
  <div id="force-graph" class="h-full w-full border-2 border-neutral-800">
    <div
      id="svg-wrapper"
      class="w-full h-full bg-surface cursor-grab active:cursor-grabbing select-none"
      :class="{ relative: !fullScreen, 'fixed inset-0 z-50': fullScreen }"
    >
      <div class="absolute top-5 right-5">
        <div class="mb-2">
          <button class="button-primary" @click="fullScreen = !fullScreen">
            <ArrowsPointingOutIcon v-if="!fullScreen" class="h-6 w-6" />
            <ArrowsPointingInIcon v-else class="h-6 w-6" />
          </button>
        </div>
        <div class="mb-2">
          <button id="zoom-in" class="button-primary">
            <PlusIcon class="h-6 w-6" />
          </button>
        </div>
        <div class="mb-2">
          <button id="zoom-out" class="button-primary">
            <MinusIcon class="h-6 w-6" />
          </button>
        </div>
        <div v-if="selectedNode" class="relative group/open-conjuration">
          <button class="button-gradient" @click="viewConjuration">
            <ArrowUpOnSquareIcon class="h-6 w-6" />
          </button>
          <div
            class="tooltip-bottom-left hidden group-hover/open-conjuration:block"
          >
            View Selected Conjuration
            <div class="tooltip-arrow" />
          </div>
        </div>
      </div>
      <div v-if="selectedNode" class="absolute top-5 left-5 text-neutral-500">
        <div class="flex gap-2">
          <div class="h-5 w-5 bg-blue-500"></div>
          Incoming Relationships
        </div>
        <div class="flex gap-2">
          <div class="h-5 w-5 bg-fuchsia-500"></div>
          Outgoing Relationships
        </div>
      </div>
      <div
        v-if="!data.nodes.length"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-500"
      >
        No Relationships
      </div>
    </div>
  </div>
</template>

<style scoped></style>

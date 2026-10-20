// Tiny fixture decoder for the repository's non-interlaced, 8-bit RGB/RGBA PNGs.
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import assert from 'node:assert/strict';
export function readRgbaPng(path) {
  const png=readFileSync(path), chunks=[];let width,height,bpp;
  for(let i=8;i<png.length;){const n=png.readUInt32BE(i),type=png.toString('ascii',i+4,i+8),data=png.subarray(i+8,i+8+n);i+=n+12;
    if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);assert.equal(data[8],8);assert([2,6].includes(data[9]));bpp=data[9]===6?4:3;assert.equal(data[12],0);}
    if(type==='IDAT')chunks.push(data);
  }
  const raw=inflateSync(Buffer.concat(chunks)), data=new Uint8ClampedArray(width*height*bpp),stride=width*bpp;
  let p=0;
  for(let y=0;y<height;y++){const filter=raw[p++];for(let x=0;x<stride;x++){
    const i=y*stride+x,a=x>=bpp?data[i-bpp]:0,b=y?data[i-stride]:0,c=y&&x>=bpp?data[i-stride-bpp]:0;
    let predictor=0;if(filter===1)predictor=a;else if(filter===2)predictor=b;else if(filter===3)predictor=Math.floor((a+b)/2);else if(filter===4){const v=a+b-c,pa=Math.abs(v-a),pb=Math.abs(v-b),pc=Math.abs(v-c);predictor=pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
    else assert.equal(filter,0);data[i]=(raw[p++]+predictor)&255;
  }}
  if(bpp===4)return {data,width,height};
  const rgba=new Uint8ClampedArray(width*height*4);for(let i=0;i<width*height;i++)rgba.set([data[i*3],data[i*3+1],data[i*3+2],255],i*4);
  return {data:rgba,width,height};
}

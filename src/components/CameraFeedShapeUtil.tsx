/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/rules-of-hooks */
import {
	Geometry2d,
	HTMLContainer,
	Rectangle2d,
	resizeBox,
	ShapeUtil,
	TLBaseShape,
	TLOnResizeHandler,
	toDomPrecision,
} from '@tldraw/tldraw'
import { useEffect, useRef } from 'react'

export type CameraFeedShape = TLBaseShape<
	'camera-feed',
	{
		w: number
		h: number
		name: string
		overlayResult?: boolean
		src?: string
	}
>

export class CameraFeedShapeUtil extends ShapeUtil<CameraFeedShape> {
	static type = 'camera-feed' as any

	override canBind = () => false
	override canUnmount = () => false
	override isAspectRatioLocked = () => false

	getDefaultProps() {
		return {
			// 16 by 9
			w: 512,
			h: 360,
			name: '',
		}
	}

	override getGeometry(shape: CameraFeedShape): Geometry2d {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}
	override onResize: TLOnResizeHandler<any> = (shape, info) => {
		return resizeBox(shape, info)
	}

	indicator(shape: CameraFeedShape) {
		const bounds = this.editor.getShapeGeometry(shape).bounds

		return <rect width={toDomPrecision(bounds.width)} height={toDomPrecision(bounds.height)} />
	}

	ref: HTMLVideoElement | null = null

	override component(shape: CameraFeedShape) {
		const videoRef = useRef<HTMLVideoElement>(null)

		this.ref = videoRef.current

		// Get the user's camera
		useEffect(() => {
			const constraints = {
				video: {
					width: shape.props.w,
					height: shape.props.h,
				},
			}
			navigator.mediaDevices
				.getUserMedia({ video: constraints as any })
				.then((stream) => {
					if (videoRef.current) {
						videoRef.current.srcObject = stream
					}
				})
				.catch((error) => {
					console.error('Error accessing media devices.', error)
				})
		}, [shape.props.w, shape.props.h])

		return (
			<HTMLContainer>
				<video
					autoPlay
					muted
					playsInline
					ref={videoRef}
					style={{
						width: '100%',
						height: '100%',
						// objectFit: 'cover',
						// flip horizontally
						transform: 'scaleX(-1)',
					}}
				/>
			</HTMLContainer>
		)
	}

	override toSvg(shape: CameraFeedShape) {
		// get an image of the video stream

		const video = this.ref
		if (!video) throw new Error('Video ref not found')
		if (canvas.width !== shape.props.w || canvas.height !== shape.props.h) {
			canvas.width = shape.props.w * 2
			canvas.height = shape.props.h * 2
		}
		// flip horizontally
		ctx?.scale(-1, 1)
		ctx?.translate(-shape.props.w, 0)
		ctx?.drawImage(video, 0, 0, shape.props.w, shape.props.h)
		const dataUrl = canvas.toDataURL('image/png')
		const svgImageElement = document.createElementNS('http://www.w3.org/2000/svg', 'image')
		svgImageElement.setAttribute('href', dataUrl)
		// svgImageElement.setAttribute('width', shape.props.w.toString())
		// svgImageElement.setAttribute('height', shape.props.h.toString())
		// svgImageElement.setAttribute('x', '-100')
		// svgImageElement.setAttribute('y', '0')
		return svgImageElement
	}
}

let canvas = null
let ctx = null
if (globalThis.window) {
	canvas = document.createElement('canvas')
	ctx = canvas.getContext('2d')
	canvas.width = 512
	canvas.height = 512
}

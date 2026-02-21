declare namespace JSX {
    interface IntrinsicElements {
        'iconify-icon': {
            icon?: string;
            width?: string | number;
            height?: string | number;
            class?: string;
            className?: string;
            style?: React.CSSProperties;
            [key: string]: any;
        };
    }
}

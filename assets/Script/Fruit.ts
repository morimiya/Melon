
import { _decorator, Component, Node, Sprite, Collider2D, Contact2DType } from 'cc';
import {FruitItem} from "./GameManager"
const { ccclass, property } = _decorator;

@ccclass('Fruit')
export class Fruit extends Component {

    private id: number = 0;

    init (data: FruitItem) {
        this.id = data.id;
        let sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.spriteFrame = data.img;
        }
    }

    getID() {
        return this.id;
    }

    onBeginContact (selfCollider: Collider2D, otherCollider: Collider2D, contact: any) {
        // 只在两个碰撞体开始接触时被调用一次
        if (selfCollider.node && otherCollider.node) {
            const s = selfCollider.node.getComponent(Fruit);
            const o = otherCollider.node.getComponent(Fruit);
            if (s && o) {
                if (s.id === o.id) {
                    console.log("emit sameContact");
                    selfCollider.node.emit('sameContact', selfCollider, otherCollider);
                }
            }
            // else if (s) {
            //     otherCollider.node.emit('warnlineContact', otherCollider);
            // }
            // else if (o) {
            //     selfCollider.node.emit('warnlineContact', selfCollider);
            // }
        }
    }

    start () {
        let collider = this.getComponent(Collider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
    }

    // update (deltaTime: number) {
    //     // [4]
    // }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.0/manual/en/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.0/manual/en/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.0/manual/en/scripting/life-cycle-callbacks.html
 */
